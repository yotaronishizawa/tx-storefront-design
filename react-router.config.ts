import path from "node:path"

import type { Config } from "@react-router/dev/config"
import { sentryOnBuildEnd } from "@sentry/react-router/vite"

import { injectPrecacheManifest } from "./config/service-worker-precache"

function normalizeBasename(value: string | undefined) {
  const basePath = value?.trim()

  if (!basePath || basePath === "/") {
    return "/"
  }

  return `/${basePath.replace(/^\/+|\/+$/g, "")}`
}

export default {
  basename: normalizeBasename(process.env.VITE_APP_BASE_PATH),
  // SPA mode: every OPM call runs over SignalR in the browser, so a server render has nothing to load.
  ssr: false,
  buildEnd: async (args) => {
    // Injects debug IDs and uploads the source maps, then deletes them from `build/`.
    await sentryOnBuildEnd(args)
    // Last, so the precache lists the files as they ship.
    await injectPrecacheManifest(
      path.join(args.reactRouterConfig.buildDirectory, "client")
    )
  },
} satisfies Config
