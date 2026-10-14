import { useEffect } from "react"

import { useLocation } from "react-router"

import { ROUTES } from "~/config/routes"
import { readAppShellState, useAppShellStore } from "~/domains/app-shell"
import {
  useManualReplenishmentActive,
  useManualReplenishmentId,
} from "~/domains/operations"
import { useSession } from "~/domains/session"
import { isSamePathname } from "~/utils/pathname"

/** Offers the open manual-replenishment task from any page except /manual, unless the operator dismissed it. */
export function useManualReplenishmentPrompt() {
  const { pathname } = useLocation()
  const session = useSession()
  const manualReplenishmentActive = useManualReplenishmentActive()
  const manualReplenishmentId = useManualReplenishmentId()

  const dismissedManualTaskPromptId = useAppShellStore(
    (state) => state.dismissedManualTaskPromptId
  )

  useEffect(() => {
    const shell = readAppShellState()

    if (
      !session ||
      !manualReplenishmentActive ||
      !manualReplenishmentId ||
      isSamePathname(pathname, ROUTES.manual().pathname)
    ) {
      shell.setPendingManualTaskPromptId("")
      if (!manualReplenishmentActive) {
        shell.clearDismissedManualTaskPrompt()
      }
      return
    }

    if (dismissedManualTaskPromptId !== manualReplenishmentId) {
      shell.setPendingManualTaskPromptId(manualReplenishmentId)
    }
  }, [
    dismissedManualTaskPromptId,
    manualReplenishmentActive,
    manualReplenishmentId,
    session,
    pathname,
  ])
}
