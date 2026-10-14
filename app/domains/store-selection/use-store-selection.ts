import type { Store } from "~/api/opm/schemas"
import { storeSelectedStoreId, useSession } from "~/domains/session"

import type { StoreContext } from "./services/store-context"
import {
  selectSelectedRobotId,
  selectSelectedStore,
  useStoreSelectionStore,
} from "./store-selection-store"

export function useStores(): Store[] {
  return useStoreSelectionStore((state) => state.stores)
}

export function useSelectedStoreId(): string {
  return useStoreSelectionStore((state) => state.selectedStoreId)
}

/** True once the selected store's data has loaded, or failed to. */
export function useStoreDataSettled(): boolean {
  return useStoreSelectionStore(
    (state) => state.loadState === "ready" || state.loadState === "error"
  )
}

/** `null` until the store list has loaded. */
export function useSelectedStore(): Store | null {
  return useStoreSelectionStore(selectSelectedStore)
}

/** `null` until the operator is signed in and the selected store has loaded. */
export function useStoreContext(): StoreContext | null {
  const session = useSession()
  const selectedStore = useSelectedStore()
  return session && selectedStore ? { session, selectedStore } : null
}

export function useSelectedRobotId(): string {
  return useStoreSelectionStore(selectSelectedRobotId)
}

/** Switching store persists the choice so the next launch reopens it. */
export function useChangeStore(): (storeId: string) => void {
  const setSelectedStoreId = useStoreSelectionStore(
    (state) => state.setSelectedStoreId
  )

  return (storeId: string) => {
    storeSelectedStoreId(storeId)
    setSelectedStoreId(storeId)
  }
}
