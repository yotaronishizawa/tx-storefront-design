import * as Sentry from "@sentry/react-router"

import { APP_VERSION, SENTRY_DSN } from "~/config/env"
import { installErrorReporter } from "~/config/error-reporting"

// No DSN, no Sentry: `dev` builds report nothing.
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    release: APP_VERSION,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.reactRouterTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // The tablet stays open all shift; tracing every navigation burns quota for little.
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  })

  installErrorReporter({
    log(level, scope, line, details) {
      const described = describe(details)
      Sentry.logger[level](
        line,
        described === undefined ? { scope } : { scope, details: described }
      )
      if (level === "warn") {
        return
      }

      const context = { tags: { scope }, extra: { message: line, details } }
      if (details instanceof Error) {
        Sentry.captureException(details, context)
      } else {
        Sentry.captureMessage(line, { ...context, level: "error" })
      }
    },
    setOperatorScope({ agentId, storeId, robotId }) {
      Sentry.setUser(agentId ? { id: agentId } : null)
      Sentry.setTag("store.id", storeId || undefined)
      Sentry.setTag("robot.id", robotId || undefined)
    },
  })
}

/** A log attribute is a primitive; an `Error` stringifies to `{}`, so name it. */
function describe(details: unknown): string | undefined {
  if (details === undefined) {
    return undefined
  }
  if (details instanceof Error) {
    return `${details.name}: ${details.message}`
  }
  if (typeof details === "string") {
    return details
  }
  try {
    return JSON.stringify(details)
  } catch {
    return String(details)
  }
}
