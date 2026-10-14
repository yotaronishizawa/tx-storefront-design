import { signIn } from "~/api/opm"
import type { AuthSession, Credentials, SignInResult } from "~/api/opm/schemas"
import { createLogger } from "~/config/logger"
import { readAppShellState } from "~/domains/app-shell"
import { translate } from "~/initializer/i18n"

import { readSessionState } from "../session-store"
import { storeCredentials, storeSession } from "../storage/session-storage"

const logger = createLogger("Session")

/**
 * Signing in; signing out is `signOutSession()` in `reset-domain-stores.ts`.
 * `signInWithCredentials` is also the reauth path after an OPM `Unauthorized`;
 * it throws when OPM cannot be reached, so a reauth can tell that from a refusal.
 */
export function useSessionActions() {
  async function signInWithCredentials(
    agentId: string,
    password: string
  ): Promise<AuthSession | null> {
    const result = await signIn(agentId, password)
    const errorCode = result?.signInErrorCode ?? "None"
    if (!result?.token || errorCode !== "None") {
      readAppShellState().setError(signInErrorMessage(errorCode))
      return null
    }

    const nextSession = { agentId, token: result.token }
    storeCredentials({ agentId, password })
    storeSession(nextSession)
    readSessionState().setSession(nextSession)
    return nextSession
  }

  async function handleLogin({ agentId, password }: Credentials) {
    readAppShellState().setError("")
    try {
      await signInWithCredentials(agentId.trim(), password)
    } catch (caught) {
      logger.warn("Sign-in could not reach OPM.", caught)
      readAppShellState().setError(translate("loginConnectionFailed"))
    }
  }

  return { handleLogin, signInWithCredentials }
}

function signInErrorMessage(
  errorCode: NonNullable<SignInResult["signInErrorCode"]>
): string {
  if (errorCode === "BadRequest" || errorCode === "InternalServerError") {
    return translate("loginServerError")
  }
  if (errorCode === "RobotNotAssignedToStore") {
    return translate("loginRobotNotAssigned")
  }
  return translate("loginInvalidCredentials")
}
