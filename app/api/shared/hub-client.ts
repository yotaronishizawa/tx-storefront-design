import {
  HttpTransportType,
  HubConnectionBuilder,
  HubConnectionState,
  type HubConnection,
} from "@microsoft/signalr"

import { createLogger } from "~/config/logger"
import { delay } from "~/utils/poll"

import { createWireLog, type WireLog } from "./wire-log"

const RECONNECT_DELAYS_MS = [0, 1000, 2000, 5000, 10000]
const RESTART_AFTER_CLOSE_MS = 5000
const RECONNECTING_TIMEOUT_MS = 10000
const RECONNECTING_POLL_MS = 100

const logger = createLogger("Hub")

type Handler = (...payloads: unknown[]) => void
type Listener<T> = (value: T) => void

type HubClientOptions = {
  /** Unset means this deployment has no such hub, and nothing ever connects. */
  url: string | undefined
  /** Prefix on every wire-log line. */
  scope: string
  /** Retry a refused skip-negotiation start with negotiation, from then on. */
  negotiationFallback?: boolean
}

/** One SignalR hub: connects on first use, restarts after a hard close, keeps handlers across rebuilds. */
export class HubClient {
  readonly log: WireLog
  private connection: HubConnection | null = null
  private starting: Promise<void> | null = null
  private connected = false
  private stopped = false
  private negotiate = false
  /** Set when the hub closed on its own, so the start that brings it back counts as a restore. */
  private lost = false
  private restartTimer: ReturnType<typeof globalThis.setTimeout> | null = null
  private readonly handlers = new Map<string, Set<Handler>>()
  private readonly connectionListeners = new Set<Listener<boolean>>()
  private readonly restoreListeners = new Set<() => void | Promise<void>>()

  constructor(private readonly options: HubClientOptions) {
    this.log = createWireLog(options.scope)
  }

  get isConnected(): boolean {
    return this.connected
  }

  /** Closed on purpose by `stop()`, until the next `start()`. */
  get isStopped(): boolean {
    return this.stopped
  }

  /** A hub event handler, kept across rebuilt connections; returns the unsubscribe. */
  on(event: string, handler: Handler): () => void {
    let handlers = this.handlers.get(event)
    if (!handlers) {
      handlers = new Set()
      this.handlers.set(event, handlers)
    }
    handlers.add(handler)
    this.connection?.on(event, handler)
    return () => {
      handlers.delete(handler)
      this.connection?.off(event, handler)
    }
  }

  /** Called now and on every change of the connected flag; returns the unsubscribe. */
  onConnectionChange(listener: Listener<boolean>): () => void {
    this.connectionListeners.add(listener)
    listener(this.connected)
    return () => this.connectionListeners.delete(listener)
  }

  /** Called each time the hub comes back after dropping, which loses its subscriptions; returns the unsubscribe. */
  onRestored(listener: () => void | Promise<void>): () => void {
    this.restoreListeners.add(listener)
    return () => this.restoreListeners.delete(listener)
  }

  /** Opens the connection, or waits for the one being opened. */
  async start(): Promise<void> {
    const { url } = this.options
    if (!url) {
      return
    }
    this.stopped = false
    this.clearRestartTimer()
    this.connection ??= this.build(url)

    const { state } = this.connection
    if (state === HubConnectionState.Connected) {
      return
    }
    if (this.starting) {
      return this.starting
    }
    if (state !== HubConnectionState.Disconnected) {
      return this.waitWhileReconnecting()
    }

    this.starting = this.open(url).finally(() => {
      this.starting = null
    })
    return this.starting
  }

  /** Closes on purpose, with no restart until the next `start()`. */
  async stop(): Promise<void> {
    this.stopped = true
    this.lost = false
    this.clearRestartTimer()
    await this.drop()
  }

  /** Throws away the connection for a fresh one: for a socket that claims to be open but is not. */
  async restart(): Promise<void> {
    await this.drop()
    this.lost = true
    await this.start()
  }

  /** A hub method, once the connection is open; the result is `unknown` until a schema reads it. */
  async invoke(method: string, ...args: unknown[]): Promise<unknown> {
    await this.start()
    if (!this.connection) {
      throw new Error(`${this.options.scope} has no URL configured.`)
    }
    return this.connection.invoke<unknown>(method, ...args)
  }

  /** As `invoke`, but only on an open connection: for best-effort cleanup that must not reconnect. */
  async invokeIfOpen(method: string, ...args: unknown[]): Promise<unknown> {
    if (this.connection?.state !== HubConnectionState.Connected) {
      return undefined
    }
    return this.connection.invoke<unknown>(method, ...args)
  }

  /** `run`, logged under `name` as its request and then its answer or error. */
  async traced<T>(
    name: string,
    args: unknown,
    run: () => Promise<T>
  ): Promise<T> {
    this.log("REQUEST", name, args)
    try {
      const result = await run()
      this.log("RESPONSE", name, result)
      return result
    } catch (error) {
      this.log("ERROR", name, error)
      throw error
    }
  }

  private async open(url: string): Promise<void> {
    try {
      await this.startCurrent(url)
    } catch (error) {
      this.scheduleRestart()
      throw error
    }
    this.setConnected(true)
    if (this.lost) {
      await this.restore()
    }
  }

  /** Skips negotiation first when allowed to fall back; a hub that refuses gets negotiation from then on. */
  private async startCurrent(url: string): Promise<void> {
    try {
      await this.connection?.start()
    } catch (error) {
      if (!this.options.negotiationFallback || this.negotiate) {
        throw error
      }
      this.negotiate = true
      await this.drop()
      this.connection = this.build(url)
      await this.connection.start()
    }
  }

  /** Detaches before stopping, so the old connection's `onclose` sees it is no longer current. */
  private async drop(): Promise<void> {
    const connection = this.connection
    this.connection = null
    this.setConnected(false)
    await connection?.stop()
  }

  private async restore(): Promise<void> {
    this.lost = false
    for (const listener of this.restoreListeners) {
      await listener()
    }
  }

  /** SignalR is mid-reconnect: wait for it to land, or for it to give up and start over. */
  private async waitWhileReconnecting(): Promise<void> {
    const deadline = Date.now() + RECONNECTING_TIMEOUT_MS
    for (;;) {
      const state = this.connection?.state
      if (state === HubConnectionState.Connected) {
        return
      }
      if (state === undefined || state === HubConnectionState.Disconnected) {
        return this.start()
      }
      if (Date.now() > deadline) {
        throw new Error(`${this.options.scope} did not reconnect in time.`)
      }
      await delay(RECONNECTING_POLL_MS)
    }
  }

  private build(url: string): HubConnection {
    const next = new HubConnectionBuilder()
      .withUrl(url, {
        transport: HttpTransportType.WebSockets,
        skipNegotiation: !this.negotiate,
      })
      .withAutomaticReconnect(RECONNECT_DELAYS_MS)
      .build()

    for (const [event, handlers] of this.handlers) {
      for (const handler of handlers) {
        next.on(event, handler)
      }
    }

    const isCurrent = () => this.connection === next
    next.onreconnecting(() => {
      if (isCurrent()) {
        this.setConnected(false)
      }
    })
    next.onreconnected(() => {
      if (isCurrent()) {
        this.setConnected(true)
        void this.restore().catch((error: unknown) =>
          logger.error(
            `${this.options.scope} failed to restore after reconnecting.`,
            error
          )
        )
      }
    })
    next.onclose(() => {
      if (!isCurrent() || this.stopped) {
        return
      }
      this.setConnected(false)
      this.lost = true
      this.scheduleRestart()
    })

    return next
  }

  private scheduleRestart(): void {
    if (this.stopped || this.restartTimer) {
      return
    }
    this.restartTimer = globalThis.setTimeout(() => {
      this.restartTimer = null
      // The LAN drops often and this retries until it lands, so a miss is only logged.
      void this.start().catch((error: unknown) =>
        logger.warn(`${this.options.scope} restart failed.`, error)
      )
    }, RESTART_AFTER_CLOSE_MS)
  }

  private clearRestartTimer(): void {
    if (this.restartTimer) {
      globalThis.clearTimeout(this.restartTimer)
      this.restartTimer = null
    }
  }

  private setConnected(connected: boolean): void {
    if (this.connected === connected) {
      return
    }
    this.connected = connected
    for (const listener of this.connectionListeners) {
      listener(connected)
    }
  }
}
