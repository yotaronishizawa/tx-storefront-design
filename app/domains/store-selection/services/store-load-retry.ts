import { readAppShellState } from "~/domains/app-shell"
import { translate } from "~/initializer/i18n"

import { readStoreSelectionState } from "../store-selection-store"

/** After a failed store load: true to try again, false when the operator chose to sign out. */
export async function askRetryStoreLoad(): Promise<boolean> {
  readStoreSelectionState().setLoadState("error")
  const choice = await readAppShellState().askOperatorWhenIdle({
    buttons: "retry-logout",
    home: false,
    message: translate("storeLoadFailed"),
  })
  return choice === "confirm"
}
