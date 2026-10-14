import { useEffect } from "react"

import { readAppShellState } from "~/domains/app-shell"
import { useSession } from "~/domains/session"
import { useSelectedRobotId, useSelectedStore } from "~/domains/store-selection"
import { translate } from "~/initializer/i18n"

/** A store with no robot yet says so once each time it is opened. */
export function useNoRobotNotice() {
  const session = useSession()
  // The store itself, not just its id: a remembered id has no robot until the list loads.
  const storeId = useSelectedStore()?.id ?? ""
  const robotId = useSelectedRobotId()
  const signedIn = Boolean(session)

  useEffect(() => {
    if (!signedIn || !storeId || robotId) {
      return
    }
    void readAppShellState().askOperatorWhenIdle({
      buttons: "ok",
      home: false,
      message: translate("robotNotInstalledNotice"),
    })
  }, [robotId, signedIn, storeId])
}
