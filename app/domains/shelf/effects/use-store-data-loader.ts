import { useEffect } from "react"

import { createLogger } from "~/config/logger"
import { Toast } from "~/core"
import { readAppShellState } from "~/domains/app-shell"
import {
  readSessionState,
  readSessionToken,
  useSession,
} from "~/domains/session"
import {
  askRetryStoreLoad,
  readStoreSelectionState,
  useSelectedStore,
} from "~/domains/store-selection"
import { translate } from "~/initializer/i18n"

import {
  applyStoreSnapshot,
  fetchStoreSnapshot,
} from "../services/store-snapshot"
import { readShelfState } from "../shelf-store"

const PARTIAL_LOAD_TOAST_ID = "store-data-partial"

const logger = createLogger("Store Data")

/**
 * Loads everything about the selected store in one batch, so there is one
 * spinner and one partial-failure report. A failed load asks to retry or sign out.
 */
export function useStoreDataLoader({ signOut }: { signOut: () => void }) {
  const agentId = useSession()?.agentId ?? ""
  const selectedStore = useSelectedStore()

  useEffect(() => {
    if (!agentId || !selectedStore) {
      return
    }

    const activeStore = selectedStore
    let cancelled = false
    const current = () =>
      !cancelled &&
      readStoreSelectionState().selectedStoreId === activeStore.id &&
      readSessionState().session?.agentId === agentId

    async function loadStoreData(): Promise<void> {
      if (!current()) return
      const activeToken = readSessionToken()
      readStoreSelectionState().setLoadState("loading")
      readAppShellState().setError("")
      Toast.notify.dismiss(PARTIAL_LOAD_TOAST_ID)
      // Another store's list, or none, stays unread until this load reads it, so it cannot be saved here.
      if (readShelfState().recommendationCountsStoreId !== activeStore.id) {
        readShelfState().failRecommendationCountsRead()
      }

      // Optional calls may fail without failing the load, but are counted for the warning.
      let failedCalls = 0

      try {
        const snapshot = await fetchStoreSnapshot({
          store: activeStore,
          token: activeToken,
          includeCatalog: true,
          onOptionalFailure: () => {
            failedCalls += 1
          },
        })

        if (!current()) return
        // Silent reauth must not leave a store stuck loading or apply an old reply.
        if (readSessionToken() !== activeToken) return loadStoreData()

        // An unread list stays unsaveable: saving would replace OPM's whole list.
        applyStoreSnapshot(snapshot, { unreadRecommendations: "fail" })
        readShelfState().selectCell(null)

        readStoreSelectionState().setLoadState("ready")

        if (failedCalls > 0) {
          Toast.notify.warning(
            translate("storeDataPartiallyLoaded", { count: failedCalls }),
            { duration: 15_000, key: PARTIAL_LOAD_TOAST_ID }
          )
        }
      } catch (caught) {
        if (!current()) {
          return
        }
        if (readSessionToken() !== activeToken) return loadStoreData()
        logger.warn("The store data failed to load.", caught)
        const retry = await askRetryStoreLoad()
        if (!current()) {
          return
        }
        if (retry) {
          return loadStoreData()
        }
        signOut()
      }
    }

    void loadStoreData()

    return () => {
      cancelled = true
    }
  }, [agentId, selectedStore, signOut])
}
