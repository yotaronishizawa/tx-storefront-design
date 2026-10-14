import { useEffect, useRef } from "react"

// Centres the element while `active`; bumping `signal` re-scrolls to it.
export function useScrollIntoView<T extends HTMLElement>(
  active: boolean,
  signal = 0
) {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    if (!active) {
      return
    }

    const frameId = window.requestAnimationFrame(() => {
      ref.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      })
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [active, signal])

  return ref
}
