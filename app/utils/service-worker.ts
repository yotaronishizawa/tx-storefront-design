import { APP_BASE_PATH, assetHref } from "./asset-href"

const SERVICE_WORKER_URL = assetHref("sw.js")

/** Off in this mock: a deploy must show on the next reload, not after an update banner. */
function isServiceWorkerEnabled(): boolean {
  return false
}

/**
 * Registers `sw.js` and calls `onUpdateReady` once a new version has installed
 * and is waiting to take over. Checks every `checkIntervalMs` and whenever the
 * page becomes visible again. Returns the cleanup.
 */
export function watchServiceWorkerUpdates(
  onUpdateReady: () => void,
  checkIntervalMs: number
): () => void {
  if (!isServiceWorkerEnabled()) {
    return () => {}
  }

  let registration: ServiceWorkerRegistration | undefined
  let stopped = false

  function reportIfWaiting() {
    // No controller means a first install: there is no older version to replace.
    if (
      !stopped &&
      registration?.waiting &&
      navigator.serviceWorker.controller
    ) {
      onUpdateReady()
    }
  }

  function watchInstalling() {
    registration?.installing?.addEventListener("statechange", reportIfWaiting)
  }

  function checkForUpdate() {
    if (registration && !document.hidden) {
      registration.update().catch(() => undefined)
    }
  }

  navigator.serviceWorker
    .register(SERVICE_WORKER_URL, { scope: APP_BASE_PATH })
    .then((nextRegistration) => {
      registration = nextRegistration
      registration.addEventListener("updatefound", watchInstalling)
      watchInstalling()
      reportIfWaiting()
    })
    .catch(() => undefined)

  const interval = window.setInterval(checkForUpdate, checkIntervalMs)
  document.addEventListener("visibilitychange", checkForUpdate)

  return () => {
    stopped = true
    window.clearInterval(interval)
    document.removeEventListener("visibilitychange", checkForUpdate)
    registration?.removeEventListener("updatefound", watchInstalling)
  }
}

/** Hands control to the waiting version and reloads once it has it; reloads at once without one. */
export async function applyServiceWorkerUpdate(): Promise<void> {
  const registration = isServiceWorkerEnabled()
    ? await navigator.serviceWorker.getRegistration(APP_BASE_PATH)
    : undefined
  const waiting = registration?.waiting

  if (!waiting) {
    window.location.reload()
    return
  }

  navigator.serviceWorker.addEventListener(
    "controllerchange",
    () => window.location.reload(),
    { once: true }
  )
  waiting.postMessage({ type: "SKIP_WAITING" })
}
