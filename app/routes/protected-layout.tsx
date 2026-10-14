import { useMemo } from "react"

import { Navigate, Outlet, useLocation } from "react-router"

import { AppBootSplash } from "~/components/layout/app-boot-splash"
import { ROUTES } from "~/config/routes"
import { useIsBootstrapping, useSession } from "~/domains/session"

/** Auth gate, no chrome. Splash while bootstrapping, so a deep link is not bounced to /login before the session is restored. */
export default function ProtectedLayout() {
  const isBootstrapping = useIsBootstrapping()
  const session = useSession()
  const location = useLocation()

  // `<Navigate>` has `state` in its effect deps; an inline object would cancel the redirect every render.
  const redirectState = useMemo(
    () => ({ from: location.pathname + location.search }),
    [location.pathname, location.search]
  )

  if (isBootstrapping) {
    return <AppBootSplash />
  }

  if (!session) {
    return (
      <Navigate replace state={redirectState} to={ROUTES.login().pathname} />
    )
  }

  return <Outlet />
}
