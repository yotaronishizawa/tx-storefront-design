import { ensureConnection, onReconnected } from "~/api/opm"
import { Toast } from "~/core"
import { translate } from "~/initializer/i18n"
import type { StoreAction } from "~/types/busy-action"
import { retryWithBackoff } from "~/utils/retry"

import {
  getActionResponseError,
  isTransportError,
  type ActionFailure,
  type RobotRestartFailure,
} from "./action-results"
import { STORE_ACTIONS } from "./store-actions"

type ActionAttempt =
  | { ok: true; result: unknown; restartFailure: RobotRestartFailure | null }
  | { ok: false; failure: ActionFailure }

const TRANSPORT_BACKOFF = { retries: 3, initialDelayMs: 1000, maxDelayMs: 8000 }
const SERVER_BACKOFF = { retries: 3, initialDelayMs: 3000, maxDelayMs: 8000 }

const RECONNECT_ATTEMPTS = 5
const RECONNECT_WAIT_MS = 20_000

/** SignalR's own reconnect gives up after ~18s, so a lost hub is asked again this often. */
const RECONNECT_POLL_MS = 2000

/** One toast for every automatic retry. */
const RETRY_TOAST_KEY = "store-action-retry"

type RetryToast = (
  message: "actionRetryingIn" | "actionWaitingForReconnect",
  retry: { attempt: number; total: number; delayMs: number }
) => void

/** Runs `callback` with the automatic retries `STORE_ACTIONS[action].retry` asks for. */
export async function attemptStoreAction(
  action: StoreAction,
  callback: () => Promise<unknown>,
  replay = true
): Promise<ActionAttempt> {
  const { label } = STORE_ACTIONS[action]
  const retry = replay ? STORE_ACTIONS[action].retry : undefined
  const toast = createRetryToast(translate(label))

  async function call(): Promise<unknown> {
    if (!retry?.transport) {
      return callback()
    }
    return retryWithBackoff(callback, {
      ...TRANSPORT_BACKOFF,
      onRetry: announceRetry(toast, TRANSPORT_BACKOFF.retries),
      shouldRetry: (outcome) => !outcome.ok && isTransportError(outcome.error),
    })
  }

  async function once(): Promise<ActionAttempt> {
    try {
      const result = await call()
      const failure = getActionResponseError(action, result)
      if (failure?.kind === "failed") {
        return { ok: false, failure }
      }
      return { ok: true, result, restartFailure: failure }
    } catch (cause) {
      return { ok: false, failure: { kind: "thrown", cause } }
    }
  }

  try {
    if (retry?.reconnect) {
      return await retryAfterReconnect(once, toast)
    }

    const isRetryableRefusal = retry?.server
    if (isRetryableRefusal) {
      return await retryWithBackoff(once, {
        ...SERVER_BACKOFF,
        onRetry: announceRetry(toast, SERVER_BACKOFF.retries),
        shouldRetry: (outcome) => {
          if (!outcome.ok || outcome.value.ok) {
            return false
          }
          const { failure } = outcome.value
          return failure.kind === "failed" && isRetryableRefusal(failure)
        },
      })
    }

    return await once()
  } finally {
    toast.dismiss()
  }
}

function announceRetry(toast: RetryToast, retries: number) {
  return (retried: number, delayMs: number) =>
    toast("actionRetryingIn", {
      attempt: retried + 1,
      total: retries + 1,
      delayMs,
    })
}

/** Tries again only after a new reconnection, so a server error on a live hub waits 20s and gives up. */
async function retryAfterReconnect(
  once: () => Promise<ActionAttempt>,
  toast: RetryToast
): Promise<ActionAttempt> {
  for (let attempt = 1; ; attempt++) {
    const outcome = await once()
    const lastAttempt = attempt >= RECONNECT_ATTEMPTS
    if (outcome.ok || !isServerFailure(outcome.failure) || lastAttempt) {
      return outcome
    }
    toast("actionWaitingForReconnect", {
      attempt: attempt + 1,
      total: RECONNECT_ATTEMPTS,
      delayMs: RECONNECT_WAIT_MS,
    })
    const lost = outcome.failure.kind === "thrown"
    if (!(await waitForReconnect(RECONNECT_WAIT_MS, lost))) {
      return outcome
    }
  }
}

function isServerFailure(failure: ActionFailure): boolean {
  return (
    (failure.kind === "thrown" && isTransportError(failure.cause)) ||
    (failure.kind === "failed" && failure.error === "ServerError")
  )
}

/** Resolves `true` once the hub is back; after a lost connection it also asks for one. */
function waitForReconnect(timeoutMs: number, lost: boolean): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false
    const timer = globalThis.setTimeout(() => finish(false), timeoutMs)
    const unsubscribe = onReconnected(() => finish(true))
    const poll = lost
      ? globalThis.setInterval(() => {
          ensureConnection().then(
            () => finish(true),
            () => undefined
          )
        }, RECONNECT_POLL_MS)
      : undefined

    function finish(reconnected: boolean) {
      if (settled) {
        return
      }
      settled = true
      globalThis.clearTimeout(timer)
      globalThis.clearInterval(poll)
      unsubscribe()
      resolve(reconnected)
    }
  })
}

/** The retry toast, counting down each second to the next try. */
function createRetryToast(action: string): RetryToast & { dismiss(): void } {
  let ticker: ReturnType<typeof globalThis.setInterval> | undefined

  function stop() {
    globalThis.clearInterval(ticker)
    ticker = undefined
  }

  const show: RetryToast = (message, { attempt, total, delayMs }) => {
    stop()
    const due = Date.now() + delayMs
    const render = () => {
      const seconds = Math.ceil((due - Date.now()) / 1000)
      let text: string
      if (seconds > 0) {
        text = translate(message, { action, attempt, seconds, total })
      } else {
        stop()
        text = translate("actionRetrying", { action, attempt, total })
      }
      Toast.notify.loading(text, { key: RETRY_TOAST_KEY })
    }
    render()
    ticker = globalThis.setInterval(render, 1000)
  }

  return Object.assign(show, {
    dismiss() {
      stop()
      Toast.notify.dismiss(RETRY_TOAST_KEY)
    },
  })
}
