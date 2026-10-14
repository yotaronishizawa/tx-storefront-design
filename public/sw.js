// Serves the app from a precache that the build writes into this file, so every
// deploy changes it and the browser installs it as a new worker. The new worker
// waits until the app sends SKIP_WAITING; see `app/utils/service-worker.ts`.

// Replaced at build time by `config/service-worker-precache.ts`; empty in dev,
// where the app never registers this worker.
const PRECACHE_MANIFEST = self.__PRECACHE_MANIFEST ?? []

// One cache that every version shares: a key carries its file's revision, so a
// new worker reuses unchanged files and the old one keeps serving its own.
const CACHE_NAME = "tx-storefront-precache"
const APP_SHELL = "index.html"

const cacheKeys = new Map(
  PRECACHE_MANIFEST.map(({ url, revision }) => {
    const fileUrl = new URL(url, self.location.href)
    const cacheKey = new URL(fileUrl)
    cacheKey.searchParams.set("__rev", revision)
    return [fileUrl.href, cacheKey.href]
  })
)
const appShellUrl = new URL(APP_SHELL, self.location.href).href
const scopeUrl = new URL("./", self.location.href).href

self.addEventListener("install", (event) => {
  event.waitUntil(precache())
})

self.addEventListener("activate", (event) => {
  event.waitUntil(deleteStaleEntries().then(() => self.clients.claim()))
})

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    void self.skipWaiting()
  }
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") {
    return
  }

  const url = new URL(request.url)
  url.search = ""
  url.hash = ""

  // Every in-app navigation is the SPA shell; React Router resolves the path.
  const isAppNavigation =
    request.mode === "navigate" &&
    url.href.startsWith(scopeUrl) &&
    !cacheKeys.has(url.href)
  const fileUrl = isAppNavigation ? appShellUrl : url.href
  const cacheKey = cacheKeys.get(fileUrl)

  if (cacheKey) {
    event.respondWith(fromPrecache(fileUrl, cacheKey))
  }
})

async function precache() {
  const cache = await caches.open(CACHE_NAME)
  await Promise.all(
    [...cacheKeys].map(async ([fileUrl, cacheKey]) => {
      if (!(await cache.match(cacheKey))) {
        await cache.put(cacheKey, await fetchFile(fileUrl))
      }
    })
  )
}

async function deleteStaleEntries() {
  const currentKeys = new Set(cacheKeys.values())
  const cacheNames = await caches.keys()
  await Promise.all(
    cacheNames
      .filter((cacheName) => cacheName !== CACHE_NAME)
      .map((cacheName) => caches.delete(cacheName))
  )

  const cache = await caches.open(CACHE_NAME)
  const requests = await cache.keys()
  await Promise.all(
    requests
      .filter((request) => !currentKeys.has(request.url))
      .map((request) => cache.delete(request))
  )
}

// Refills an entry the settings page's "Update PWA content" cleared.
async function fromPrecache(fileUrl, cacheKey) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(cacheKey)
  if (cached) {
    return cached
  }

  const response = await fetchFile(fileUrl)
  await cache.put(cacheKey, response.clone())
  return response
}

// `reload` skips the HTTP cache: nginx marks /assets/ immutable, and the files
// copied from public/ keep their names between builds.
async function fetchFile(fileUrl) {
  const response = await fetch(fileUrl, { cache: "reload" })
  if (!response.ok) {
    throw new Error(`Precache: ${fileUrl} answered ${response.status}`)
  }
  return response
}
