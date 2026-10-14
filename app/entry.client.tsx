// First: the in-page simulator must own the hub URLs before anything connects.
import "../simulator/src/browser/install.mjs"

import { startTransition, StrictMode } from "react"

import * as Sentry from "@sentry/react-router"
import { hydrateRoot } from "react-dom/client"
import { HydratedRouter } from "react-router/dom"

import "./initializer/sentry"

// Errors a route boundary catches already reach Sentry through `onError`, so
// only what escapes every boundary, and hydration mismatches, are reported here.
startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter
        instrumentations={[Sentry.createSentryClientInstrumentation()]}
        onError={Sentry.sentryOnError}
      />
    </StrictMode>,
    {
      onUncaughtError: Sentry.reactErrorHandler(),
      onRecoverableError: Sentry.reactErrorHandler(),
    }
  )
})
