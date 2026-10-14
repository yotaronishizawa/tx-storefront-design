import { useEffect, useRef } from "react"

import { setTokenRefreshHandler } from "~/api/opm"
import type { AuthSession } from "~/api/opm/schemas"
import { createLogger } from "~/config/logger"
import { readAppShellState } from "~/domains/app-shell"
import { signOutSession } from "~/domains/reset-domain-stores"
import { readStoredCredentials } from "~/domains/session"
import { translate } from "~/initializer/i18n"

const logger = createLogger("Token Refresh")

export function useSignalRTokenRefresh({
  signInWithCredentials,
}: {
  signInWithCredentials: (
    agentId: string,
    password: string
  ) => Promise<AuthSession | null>
}) {
  const reauthInFlightRef = useRef<Promise<string | null> | null>(null)

  useEffect(() => {
    // Reauth failed for good: send the operator back to /login. Sign out before
    // setting the message, because signing out resets the app-shell store.
    function endStrandedSession() {
      signOutSession()
      readAppShellState().setError(translate("sessionExpired"))
    }

    setTokenRefreshHandler(async () => {
      if (reauthInFlightRef.current) {
        return reauthInFlightRef.current
      }

      const storedCredentials = readStoredCredentials()
      if (!storedCredentials) {
        logger.warn("Token expired with no stored credentials; signing out.")
        endStrandedSession()
        return null
      }

      reauthInFlightRef.current = signInWithCredentials(
        storedCredentials.agentId,
        storedCredentials.password
      )
        .then((nextSession) => {
          if (!nextSession) {
            logger.warn("Stored credentials were refused; signing out.")
            endStrandedSession()
            return null
          }

          return nextSession.token
        })
        .catch((caught) => {
          logger.error("Silent re-sign-in failed.", caught)
          readAppShellState().setError(translate("loginConnectionFailed"))
          return null
        })
        .finally(() => {
          reauthInFlightRef.current = null
        })

      return reauthInFlightRef.current
    })

    return () => setTokenRefreshHandler(null)
    // Installed once; re-installing would drop an in-flight reauth.
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [])
}
