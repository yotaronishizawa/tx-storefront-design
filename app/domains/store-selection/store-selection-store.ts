import { create } from "zustand"

import type { Store } from "~/api/opm/schemas"
import { getStoreRobotId } from "~/model/store-display"

type LoadState = "idle" | "loading" | "ready" | "error"

/** Which store the operator is working in, and what that store is. */
type StoreSelectionState = {
  loadState: LoadState
  selectedStoreId: string
  stores: Store[]
}

type StoreSelectionActions = {
  setLoadState: (loadState: LoadState) => void
  setSelectedStoreId: (selectedStoreId: string) => void
  setStores: (stores: Store[]) => void
}

const INITIAL_STATE: StoreSelectionState = {
  loadState: "idle",
  selectedStoreId: "",
  stores: [],
}

export const useStoreSelectionStore = create<
  StoreSelectionState & StoreSelectionActions
>((set) => ({
  ...INITIAL_STATE,

  setLoadState: (loadState) => set({ loadState }),
  setSelectedStoreId: (selectedStoreId) => set({ selectedStoreId }),
  setStores: (stores) => set({ stores }),
}))

export function selectSelectedStore(state: StoreSelectionState): Store | null {
  return (
    state.stores.find((store) => store.id === state.selectedStoreId) ?? null
  )
}

export function selectSelectedRobotId(state: StoreSelectionState): string {
  return getStoreRobotId(selectSelectedStore(state))
}

export function readStoreSelectionState(): StoreSelectionState &
  StoreSelectionActions {
  return useStoreSelectionStore.getState()
}

export function resetStoreSelectionStore() {
  useStoreSelectionStore.setState(INITIAL_STATE)
}
