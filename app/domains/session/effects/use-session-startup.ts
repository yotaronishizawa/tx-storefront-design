import { useEffect } from "react"

import { stopOpm } from "~/api/opm"
import type { AuthSession } from "~/api/opm/schemas"
import { localShelf } from "~/api/stock-shelf"
import { readAppShellState } from "~/domains/app-shell"
import { translate } from "~/initializer/i18n"

import { readSessionState } from "../session-store"
import {
  readStoredCredentials,
  readStoredSession,
} from "../storage/session-storage"

/** Resolves the session once at boot. Mount once: its cleanup stops both transports. */
export function useSessionStartup({
  signInWithCredentials,
}: {
  signInWithCredentials: (
    agentId: string,
    password: string
  ) => Promise<AuthSession | null>
}) {
  useEffect(() => {
    const session = readSessionState()

    // Every branch must finish bootstrapping, or the splash never leaves.
    const storedSession = readStoredSession()
    const storedCredentials = readStoredCredentials()

    if (storedSession) {
      session.setSession(storedSession)
      session.finishBootstrapping()
    } else if (storedCredentials) {
      void signInWithCredentials(
        storedCredentials.agentId,
        storedCredentials.password
      )
        .catch(() =>
          readAppShellState().setError(translate("loginConnectionFailed"))
        )
        .finally(() => readSessionState().finishBootstrapping())
    } else {
      session.finishBootstrapping()
    }

    return () => {
      void stopOpm()
      void localShelf.stop()
    }
    // Re-running would restore the stored session over a sign-out.
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [])
}
