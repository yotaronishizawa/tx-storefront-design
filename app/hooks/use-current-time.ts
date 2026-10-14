import { useEffect, useState } from "react"

const REFRESH_INTERVAL_MS = 20 * 1000

/** The current time, refreshed every 20 seconds: enough for a minute-resolution clock. */
export function useCurrentTime() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = window.setInterval(
      () => setNow(new Date()),
      REFRESH_INTERVAL_MS
    )

    return () => {
      window.clearInterval(interval)
    }
  }, [])

  return now
}
