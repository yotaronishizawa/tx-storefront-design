import { useEffect, useState } from "react"

// A touch is a pointerdown, and the keyboard covers a USB scanner.
const INPUT_EVENTS = ["pointerdown", "keydown", "wheel"] as const

/**
 * True once `timeoutMs` has passed with no touch, click or key press, false
 * again on the next one. Counts from the clock, so time asleep counts too.
 * While `paused`, it stays false and counts afresh once unpaused.
 */
export function useInactiveFor(timeoutMs: number, paused = false): boolean {
  const [inactive, setInactive] = useState(false)

  useEffect(() => {
    if (paused) {
      setInactive(false)
      return
    }
    let lastInputAt = Date.now()
    let timer: ReturnType<typeof setTimeout> | undefined

    function check() {
      clearTimeout(timer)
      const remaining = lastInputAt + timeoutMs - Date.now()
      if (remaining <= 0) {
        setInactive(true)
        return
      }
      timer = setTimeout(check, remaining)
    }

    function recordInput() {
      lastInputAt = Date.now()
      setInactive(false)
      check()
    }

    // A sleeping tablet pauses timers; waking it re-reads the clock.
    function checkOnVisible() {
      if (document.visibilityState === "visible") {
        check()
      }
    }

    for (const type of INPUT_EVENTS) {
      window.addEventListener(type, recordInput, {
        capture: true,
        passive: true,
      })
    }
    document.addEventListener("visibilitychange", checkOnVisible)
    timer = setTimeout(check, timeoutMs)

    return () => {
      clearTimeout(timer)
      for (const type of INPUT_EVENTS) {
        window.removeEventListener(type, recordInput, { capture: true })
      }
      document.removeEventListener("visibilitychange", checkOnVisible)
    }
  }, [timeoutMs, paused])

  return inactive
}
