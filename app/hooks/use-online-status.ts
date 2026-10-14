import { useSyncExternalStore } from "react"

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange)
  window.addEventListener("offline", onChange)
  return () => {
    window.removeEventListener("online", onChange)
    window.removeEventListener("offline", onChange)
  }
}

/** `navigator.onLine`, live. Reads as online in the prerender. */
export function useOnlineStatus() {
  return useSyncExternalStore(
    subscribe,
    () => window.navigator.onLine,
    () => true
  )
}
