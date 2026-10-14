import { readAppShellState } from "~/domains/app-shell"
import { runBusy } from "~/domains/operations"
import { readSessionState } from "~/domains/session"
import {
  readStoreSelectionState,
  useStoreContext,
} from "~/domains/store-selection"
import { translate } from "~/initializer/i18n"

import {
  applyStoreSnapshot,
  fetchStoreSnapshot,
} from "../services/store-snapshot"

/** The "reload everything" button: one parallel batch under one busy flag, so it lands or fails as a whole. */
export function useStoreRefreshAction() {
  const context = useStoreContext()

  return async function refreshAll() {
    if (!context) {
      return
    }
    const { session, selectedStore } = context

    await runBusy("refresh", async () => {
      const snapshot = await fetchStoreSnapshot({
        store: selectedStore,
        token: session.token,
        includeCatalog: false,
      })
      if (
        readStoreSelectionState().selectedStoreId !== selectedStore.id ||
        readSessionState().session?.token !== session.token
      )
        return
      // A failed read keeps the counts already shown.
      applyStoreSnapshot(snapshot, { unreadRecommendations: "keep" })
      readAppShellState().setNotice(translate("latestStoreDataLoaded"))
    })
  }
}
