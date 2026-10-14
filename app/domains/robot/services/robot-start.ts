import type { ParseKeys } from "i18next"

import { getSmartShelvesStatus } from "~/api/opm"
import type { Store } from "~/api/opm/schemas"
import { OPERATIONS_CENTER_PHONE } from "~/config/app"
import { readAppShellState, type PromptButtons } from "~/domains/app-shell"
import { runBusy, withSupportCodes } from "~/domains/operations"
import { translate } from "~/initializer/i18n"
import {
  getShelfReadiness,
  type ShelfReadiness,
} from "~/model/display-reservation"
import { isLocalV2Store } from "~/model/store-display"

type AppKey = ParseKeys<"app">

type ShelfStartPopup = {
  buttons: PromptButtons
  message: AppKey
  /** Retrying a shelf still not ready ends on the call-centre popup. */
  support: boolean
}

// "ready" and "disabled" start as usual.
const SHELF_START_POPUPS: Partial<Record<ShelfReadiness, ShelfStartPopup>> = {
  unknown: {
    buttons: "retry-close",
    message: "robotStartShelfUnknownNotice",
    support: true,
  },
  disconnected: {
    buttons: "retry-close",
    message: "robotStartShelfWifiNotice",
    support: true,
  },
  moving: {
    buttons: "to-restocking-or-close",
    message: "smartShelfAngleChanging",
    support: false,
  },
  restocking: {
    buttons: "to-restocking-or-close",
    message: "robotStartShelfRestockingNotice",
    support: false,
  },
}

// "Operator support required", the code support knows it by.
const OPERATOR_SUPPORT_CODE = "S000501"

/**
 * A local V2 store has no shelf client to refuse the start, so the shelves are
 * checked first. Resolves whether to go on.
 */
export async function checkShelvesBeforeStart(
  store: Store | null,
  token: string
): Promise<boolean> {
  if (!store || !isLocalV2Store(store)) {
    return true
  }

  const readShelves = () =>
    runBusy("robot-start-check", async () =>
      getShelfReadiness(
        await getSmartShelvesStatus(store.id, token),
        Date.now()
      )
    )

  const readiness = await readShelves()
  const popup = readiness && SHELF_START_POPUPS[readiness]
  if (!popup) {
    return readiness !== undefined
  }

  const shell = readAppShellState()
  const choice = await shell.askOperator({
    buttons: popup.buttons,
    home: false,
    message: translate(popup.message),
  })
  if (choice !== "confirm" || !popup.support) {
    return false
  }

  const retried = await readShelves()
  if (retried !== undefined && !SHELF_START_POPUPS[retried]) {
    return true
  }
  await shell.askOperator({
    buttons: "ok",
    home: false,
    message: withSupportCodes(
      translate("restartThenCallCenterNotice", {
        phone: OPERATIONS_CENTER_PHONE,
      }),
      [OPERATOR_SUPPORT_CODE]
    ),
  })
  return false
}
