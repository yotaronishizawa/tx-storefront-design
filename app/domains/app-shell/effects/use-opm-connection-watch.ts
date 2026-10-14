import { useEffect } from "react"

import { isOpmStopped, onOpmConnectionChange } from "~/api/opm"
import { createLogger } from "~/config/logger"

import { showOpmConnected, showOpmConnecting } from "../services/opm-connection"

const logger = createLogger("OPM Connection")

/** A drop shorter than this never shows; SignalR often reconnects within it. */
const SHOW_AFTER_MS = 2000

/**
 * Once OPM has been reached, a lost connection blocks the screen until it comes
 * back. Mounted once; the hub keeps retrying meanwhile.
 */
export function useOpmConnectionWatch() {
  useEffect(() => {
    let reached = false
    let showTimer: ReturnType<typeof setTimeout> | null = null

    function cancelShow() {
      if (showTimer) {
        clearTimeout(showTimer)
        showTimer = null
      }
    }

    const stop = onOpmConnectionChange((connected) => {
      if (connected) {
        reached = true
        cancelShow()
        showOpmConnected()
        return
      }
      // Not yet reached: the first connect is the boot screen's to show.
      // Stopped: sign-out closed it on purpose.
      if (!reached || showTimer || isOpmStopped()) {
        return
      }
      showTimer = setTimeout(() => {
        showTimer = null
        if (isOpmStopped()) {
          return
        }
        logger.warn("OPM connection lost; blocking the screen.")
        showOpmConnecting()
      }, SHOW_AFTER_MS)
    })

    return () => {
      stop()
      cancelShow()
      showOpmConnected()
    }
  }, [])
}
