import { useEffect } from "react"

const DOUBLE_TAP_WINDOW_MS = 300
const GESTURE_EVENTS = ["gesturestart", "gesturechange", "gestureend"] as const

/** Stops pinch and double-tap zoom, which iOS Safari allows despite `user-scalable=no`. */
export function useBlockBrowserZoom() {
  useEffect(() => {
    const blocking: AddEventListenerOptions = { passive: false }
    let lastTouchEnd = 0

    const preventDefault = (event: Event) => event.preventDefault()

    const preventPinch = (event: TouchEvent) => {
      if (event.touches.length > 1) {
        event.preventDefault()
      }
    }

    const preventDoubleTapZoom = (event: TouchEvent) => {
      const now = Date.now()
      if (now - lastTouchEnd <= DOUBLE_TAP_WINDOW_MS) {
        event.preventDefault()
      }
      lastTouchEnd = now
    }

    for (const eventName of GESTURE_EVENTS) {
      document.addEventListener(eventName, preventDefault, blocking)
    }
    document.addEventListener("touchmove", preventPinch, blocking)
    document.addEventListener("touchend", preventDoubleTapZoom, blocking)

    return () => {
      for (const eventName of GESTURE_EVENTS) {
        document.removeEventListener(eventName, preventDefault)
      }
      document.removeEventListener("touchmove", preventPinch)
      document.removeEventListener("touchend", preventDoubleTapZoom)
    }
  }, [])
}
