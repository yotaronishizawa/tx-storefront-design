/** Clears caches, nudges service workers to activate, then reloads on a cache-busting URL whatever fails. */
export async function refreshPwaContent() {
  try {
    await clearPwaCaches()
    const registrations = await updateServiceWorkers()
    activateWaitingServiceWorkers(registrations)
  } finally {
    reloadWithFreshPwaUrl()
  }
}

async function clearPwaCaches() {
  if (!("caches" in window)) {
    return
  }

  const cacheNames = await window.caches.keys()
  await Promise.all(
    cacheNames.map((cacheName) =>
      window.caches.delete(cacheName).catch(() => false)
    )
  )
}

async function updateServiceWorkers(): Promise<
  readonly ServiceWorkerRegistration[]
> {
  if (!("serviceWorker" in navigator)) {
    return []
  }

  const registrations = await navigator.serviceWorker.getRegistrations()
  await Promise.all(
    registrations.map((registration) =>
      registration.update().catch(() => undefined)
    )
  )
  return registrations
}

function activateWaitingServiceWorkers(
  registrations: readonly ServiceWorkerRegistration[]
) {
  for (const registration of registrations) {
    registration.waiting?.postMessage({ type: "SKIP_WAITING" })
    registration.installing?.postMessage({ type: "SKIP_WAITING" })
  }
}

function reloadWithFreshPwaUrl() {
  const url = new URL(window.location.href)
  url.searchParams.set("pwa-refresh", Date.now().toString())
  window.location.replace(url.toString())
}
