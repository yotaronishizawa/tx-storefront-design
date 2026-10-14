import { useEffect } from "react"

/** Calls `refresh` whenever the tab returns to the foreground. */
export function useVisibleRefresh(refresh: () => Promise<void>) {
  useEffect(() => {
    function refreshOnVisible() {
      if (document.visibilityState === "visible") {
        void refresh().catch(() => undefined)
      }
    }

    document.addEventListener("visibilitychange", refreshOnVisible)
    return () =>
      document.removeEventListener("visibilitychange", refreshOnVisible)
  }, [refresh])
}
