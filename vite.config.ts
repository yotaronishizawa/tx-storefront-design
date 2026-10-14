import { execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"

import { reactRouter } from "@react-router/dev/vite"
import { sentryReactRouter } from "@sentry/react-router/vite"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, loadEnv, type Plugin } from "vite"
import { z } from "zod"

import { envSchema } from "./config/env-schema"

const ROOT = fileURLToPath(new URL(".", import.meta.url))

function getAppVersion() {
  const configuredVersion = process.env.VITE_APP_VERSION?.trim()

  if (configuredVersion) {
    return configuredVersion
  }

  try {
    // Match the release tag namespace only, so a stray tag cannot become the version.
    return execFileSync(
      "git",
      ["describe", "--tags", "--match", "v[0-9]*", "--abbrev=0"],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }
    ).trim()
  } catch {
    return ""
  }
}

function normalizePublicBasePath(value: string | undefined) {
  const basePath = value?.trim()

  if (!basePath || basePath === "/") {
    return "/"
  }

  return `/${basePath.replace(/^\/+|\/+$/g, "")}/`
}

/**
 * Fails the build on an invalid `.env.<mode>`. Runs on `buildStart`, not in the
 * config factory, because `react-router typegen` resolves this config without
 * building and `pnpm typecheck` must not depend on the environment.
 */
function envGuard(mode: string): Plugin {
  return {
    name: "tx-env-guard",
    apply: "build",
    buildStart() {
      // By mode, not `NODE_ENV`: every build is `production`, whatever file it reads.
      const parsed = envSchema.safeParse(loadEnv(mode, ROOT, "VITE_"))

      if (!parsed.success) {
        this.error(
          `Invalid build configuration:\n${z.prettifyError(parsed.error)}`
        )
      }
    },
  }
}

const appVersion = getAppVersion()
const publicBasePath = normalizePublicBasePath(process.env.VITE_APP_BASE_PATH)
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN

export default defineConfig((config) => ({
  base: publicBasePath,

  define: {
    "import.meta.env.VITE_APP_BASE_PATH": JSON.stringify(publicBasePath),
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(appVersion),
  },

  resolve: { tsconfigPaths: true },

  // E2E builds share this checkout with the local design preview.
  server: { watch: { ignored: ["**/build/**", "**/test-results/**"] } },

  // Maps exist only to be uploaded; without a token nginx would end up serving them.
  build: { sourcemap: sentryAuthToken ? "hidden" : false },

  // Scan all source up front, or an import reached only through a lazy route
  // re-optimizes mid-session and 504s with "Outdated Optimize Dep".
  optimizeDeps: {
    entries: ["app/**/*.{ts,tsx}"],
    exclude: ["@sentry/react-router"],
  },

  plugins: [
    envGuard(config.mode),
    tailwindcss(),
    reactRouter(),
    sentryReactRouter(
      {
        telemetry: false,
        org: "telexistence-inc-jp",
        project: "storefront-ui",
        authToken: sentryAuthToken,
        // Same string as `APP_VERSION`, so an error's release matches its uploaded source maps.
        release:
          sentryAuthToken && appVersion ? { name: appVersion } : undefined,
        sourcemaps: { disable: !sentryAuthToken },
      },
      config
    ),
  ],
}))
