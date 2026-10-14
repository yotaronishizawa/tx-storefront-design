import { useEffect, useRef } from "react"

import { onReconnected } from "~/api/opm"

/** Re-checks OPM's layout on returning to the foreground and on reconnect. */
export function useLayoutFreshnessWatch(
  isBaseLayoutCurrent: () => Promise<boolean>,
  onStale: () => void
) {
  const checkRef = useRef(isBaseLayoutCurrent)
  const onStaleRef = useRef(onStale)
  useEffect(() => {
    checkRef.current = isBaseLayoutCurrent
    onStaleRef.current = onStale
  })

  useEffect(() => {
    let checking = false
    async function check() {
      if (checking) {
        return
      }
      checking = true
      try {
        if (!(await checkRef.current())) {
          onStaleRef.current()
        }
      } finally {
        checking = false
      }
    }
    function checkOnVisible() {
      if (document.visibilityState === "visible") {
        void check()
      }
    }

    document.addEventListener("visibilitychange", checkOnVisible)
    const unsubscribe = onReconnected(() => void check())
    return () => {
      document.removeEventListener("visibilitychange", checkOnVisible)
      unsubscribe()
    }
  }, [])
}
