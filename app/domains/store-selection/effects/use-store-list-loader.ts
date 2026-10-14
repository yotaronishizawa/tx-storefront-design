import { useEffect } from "react"

import { getAgent, getStores, onReconnected } from "~/api/opm"
import type { Store } from "~/api/opm/schemas"
import { createLogger } from "~/config/logger"
import { readAppShellState } from "~/domains/app-shell"
import {
  readSessionToken,
  readStoredStoreId,
  storeSelectedStoreId,
  useSession,
} from "~/domains/session"
import { translate } from "~/initializer/i18n"
import { listOperatorStores } from "~/model/store-display"

import { askRetryStoreLoad } from "../services/store-load-retry"
import {
  readStoreSelectionState,
  useStoreSelectionStore,
} from "../store-selection-store"

const logger = createLogger("Store List")

/**
 * Loads the stores the account may open, once per sign-in and again after a
 * reconnect, and resolves which one to open. Mounted app-wide.
 */
export function useStoreListLoader({ signOut }: { signOut: () => void }) {
  const agentId = useSession()?.agentId ?? ""

  useEffect(() => {
    if (!agentId) {
      return
    }

    let cancelled = false
    let loading = false

    /** `reread`: after a reconnect, with the store already open. */
    async function loadStores(reread = false) {
      if (loading) {
        return
      }
      loading = true
      if (!reread) {
        readStoreSelectionState().setLoadState("loading")
      }

      try {
        while (!cancelled) {
          try {
            const token = readSessionToken()
            const [agent, stores] = await Promise.all([
              getAgent(agentId, token),
              getStores(agentId, token),
            ])
            if (!cancelled) {
              applyStores(listOperatorStores(stores, agent), reread)
            }
            return
          } catch (caught) {
            if (cancelled) {
              return
            }
            logger.warn("The store list failed to load.", caught)
            const retry = await askRetryStoreLoad()
            if (cancelled) {
              return
            }
            if (!retry) {
              signOut()
              return
            }
            readStoreSelectionState().setLoadState("loading")
          }
        }
      } finally {
        loading = false
      }
    }

    function applyStores(stores: Store[], reread: boolean) {
      if (stores.length === 0) {
        signOut()
        readAppShellState().setError(translate("noRegisteredStores"))
        return
      }

      const current = readStoreSelectionState()
      // New store objects would reload the open store and reset /edit's working copy.
      if (reread && isSameStoreList(current.stores, stores)) {
        return
      }
      current.setStores(stores)
      current.setSelectedStoreId(
        resolveSelectedStoreId(stores, current.selectedStoreId)
      )
      current.setLoadState("ready")
    }

    void loadStores()
    const stopReconnectReload = onReconnected(() => void loadStores(true))

    return () => {
      cancelled = true
      stopReconnectReload()
    }
  }, [agentId, signOut])
}

/** The current pick if it still exists, else the stored one, else the first, else none. */
function resolveSelectedStoreId(stores: Store[], current: string): string {
  if (stores.some((store) => store.id === current)) {
    return current
  }

  const storedStoreId = readStoredStoreId()
  if (stores.some((store) => store.id === storedStoreId)) {
    return storedStoreId
  }

  return stores[0]?.id ?? ""
}

function isSameStoreList(left: Store[], right: Store[]): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

/** Mirrors the selection into storage so the next launch reopens the same store. */
export function useSelectedStorePersistence() {
  const selectedStoreId = useStoreSelectionStore(
    (state) => state.selectedStoreId
  )

  useEffect(() => {
    if (selectedStoreId) {
      storeSelectedStoreId(selectedStoreId)
    }
  }, [selectedStoreId])
}
