import { useEffect, useState } from "react"

/**
 * When something closes by itself: a bar that empties over `seconds` and the
 * seconds left in words, so staff are not left wondering when it goes.
 */
export function CloseCountdown({
  label,
  seconds,
}: {
  /** The words under the bar, given the whole seconds left. */
  label: (secondsLeft: number) => string
  seconds: number
}) {
  const [secondsLeft, setSecondsLeft] = useState(seconds)
  const [started, setStarted] = useState(false)
  useEffect(() => {
    // Next frame, so the bar transitions from full rather than starting empty.
    const frame = window.requestAnimationFrame(() => setStarted(true))
    const timer = window.setInterval(
      () => setSecondsLeft((left) => Math.max(left - 1, 1)),
      1000
    )
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearInterval(timer)
    }
  }, [])
  return (
    <div className="flex w-64 flex-col items-center gap-2">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-subtle">
        <div
          className={
            started
              ? "h-full w-0 rounded-full bg-success ease-linear"
              : "size-full rounded-full bg-success"
          }
          style={
            started
              ? { transition: `width ${seconds * 1000}ms linear` }
              : undefined
          }
        />
      </div>
      <p className="text-base text-secondary">{label(secondsLeft)}</p>
    </div>
  )
}
