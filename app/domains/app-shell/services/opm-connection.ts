import { reconnectOpm } from "~/api/opm"
import { createLogger } from "~/config/logger"

import { readAppShellState } from "../app-shell-store"

const logger = createLogger("OPM Connection")

/** How long the screen says "connecting" before it also offers Reconnect. */
const OFFER_RECONNECT_AFTER_MS = 20_000

let offerTimer: ReturnType<typeof setTimeout> | null = null

/** Blocks the screen as "connecting", and offers Reconnect if it lasts. */
export function showOpmConnecting() {
  readAppShellState().setOpmConnection("connecting")
  clearOfferTimer()
  offerTimer = setTimeout(() => {
    offerTimer = null
    readAppShellState().setOpmConnection("failed")
  }, OFFER_RECONNECT_AFTER_MS)
}

export function showOpmConnected() {
  clearOfferTimer()
  readAppShellState().setOpmConnection("connected")
}

/** The operator's Reconnect: a fresh connection, and "connecting" again until it answers. */
export function reconnectToOpm() {
  showOpmConnecting()
  void reconnectOpm().catch((caught) => {
    logger.warn("Manual reconnect failed.", caught)
    clearOfferTimer()
    readAppShellState().setOpmConnection("failed")
  })
}

function clearOfferTimer() {
  if (offerTimer) {
    clearTimeout(offerTimer)
    offerTimer = null
  }
}
