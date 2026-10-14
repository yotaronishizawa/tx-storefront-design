/*
 * A WebSocket that never leaves the page: the app's real SignalR client opens
 * it for any URL on `SIM_HOST`, and every frame goes to the simulator
 * (`session.mjs`). Anything else gets the browser's own WebSocket.
 */
import { endSession, openSession, receiveText } from "./session.mjs"

export const SIM_HOST = "sim.invalid"

const CONNECTING = 0
const OPEN = 1
const CLOSING = 2
const CLOSED = 3

// Every delivery waits a task, as a frame off the network would.
const later = (run) => setTimeout(run, 0)

export class FakeWebSocket {
  static CONNECTING = CONNECTING
  static OPEN = OPEN
  static CLOSING = CLOSING
  static CLOSED = CLOSED
  CONNECTING = CONNECTING
  OPEN = OPEN
  CLOSING = CLOSING
  CLOSED = CLOSED

  binaryType = "blob"
  bufferedAmount = 0
  extensions = ""
  protocol = ""
  readyState = CONNECTING
  onopen = null
  onmessage = null
  onerror = null
  onclose = null

  constructor(url) {
    this.url = String(url)
    later(() => this.connect(new URL(this.url).pathname))
  }

  connect(pathname) {
    if (this.readyState !== CONNECTING) {
      return
    }
    this.client = openSession(pathname, {
      send: (text) =>
        later(() => {
          if (this.readyState === OPEN) {
            this.onmessage?.({ type: "message", data: text })
          }
        }),
      // The simulator dropped the connection, as an OPM restart would.
      close: () => later(() => this.finish(1006, false)),
    })
    if (!this.client) {
      // As the Node simulator destroyed the socket of a hub that is down.
      this.onerror?.({ type: "error" })
      this.finish(1006, false)
      return
    }
    this.readyState = OPEN
    this.onopen?.({ type: "open" })
  }

  send(data) {
    if (this.readyState !== OPEN) {
      throw new Error("FakeWebSocket is not open.")
    }
    const client = this.client
    later(() => {
      void receiveText(client, String(data))
    })
  }

  close(code = 1000) {
    if (this.readyState >= CLOSING) {
      return
    }
    this.readyState = CLOSING
    if (this.client) {
      endSession(this.client)
    }
    later(() => this.finish(code, true))
  }

  finish(code, wasClean) {
    if (this.readyState === CLOSED) {
      return
    }
    this.readyState = CLOSED
    this.onclose?.({ type: "close", code, reason: "", wasClean })
  }

  addEventListener() {}
  removeEventListener() {}
}
