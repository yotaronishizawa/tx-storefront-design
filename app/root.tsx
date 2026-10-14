import { useEffect } from "react"

import { useTranslation } from "react-i18next"
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router"

import { IS_PRODUCTION } from "~/config/app"
import { Button, Toast } from "~/core"
import { useBlockBrowserZoom } from "~/hooks/use-block-browser-zoom"
import { APP_BASE_PATH, assetHref } from "~/utils/asset-href"
import { initializeStoreAudioPlayback } from "~/utils/audio"

import type { Route } from "./+types/root"

import "~/initializer/i18n"
import "./app.css"

export function Layout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation("common")

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <meta name="theme-color" content="#ffffff" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* Still required by iOS versions that ignore the standard name. */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Store App" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="manifest" href={assetHref("manifest.webmanifest")} />
        <link rel="apple-touch-icon" href={assetHref("pwa-icon-192.png")} />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <Toast.Viewport closeLabel={t("actions.close")} />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  const { i18n } = useTranslation()

  // Set here, not as a prop: the prerendered index.html cannot know the stored language.
  useEffect(() => {
    document.documentElement.lang = i18n.language
  }, [i18n.language])

  useEffect(() => initializeStoreAudioPlayback(), [])
  useBlockBrowserZoom()

  return <Outlet />
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const { t } = useTranslation()

  let message = t("error.unexpected.title")
  let details = t("error.unexpected.details")
  let stack: string | undefined

  if (isRouteErrorResponse(error) && error.status === 404) {
    message = t("error.notFound.title")
    details = t("error.notFound.details")
  } else if (isRouteErrorResponse(error)) {
    message = t("error.title")
    details = error.statusText || details
  } else if (!IS_PRODUCTION && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  return (
    <main className="container mx-auto flex flex-col items-start gap-4 p-4 pt-16">
      <h1 className="text-lg font-bold">{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full overflow-x-auto rounded-lg bg-muted p-4 text-xs">
          <code>{stack}</code>
        </pre>
      )}
      {/* A full load, not the router: the router may be what crashed. */}
      <Button onClick={() => window.location.assign(APP_BASE_PATH)}>
        {t("nav.home")}
      </Button>
    </main>
  )
}
