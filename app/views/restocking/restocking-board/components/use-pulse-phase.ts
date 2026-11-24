import { useCallback } from "react"

/** Tailwind's `animate-pulse` cycle. */
const PULSE_MS = 2000

/**
 * A ref that puts an `animate-pulse` in phase with every other one on the
 * page, so the lane on the shelf and the same lane in the zoom pulse together
 * and read as one place. A new `key` (a new lane) puts it in phase again.
 */
export function usePulsePhase(key: string | undefined) {
  return useCallback(
    (node: HTMLElement | null) => {
      if (node && key) {
        node.style.animationDelay = `-${Math.round(performance.now() % PULSE_MS)}ms`
      }
    },
    [key]
  )
}
