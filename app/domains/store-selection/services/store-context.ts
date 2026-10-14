import type { AuthSession, Store } from "~/api/opm/schemas"
import { readSessionState } from "~/domains/session"

import {
  readStoreSelectionState,
  selectSelectedStore,
} from "../store-selection-store"

/** What every store-scoped OPM call needs: a signed-in operator and a loaded store. */
export type StoreContext = {
  session: AuthSession
  selectedStore: Store
}

/** `null` until both exist; the non-reactive form of `useStoreContext()`, read at call time. */
export function readStoreContext(): StoreContext | null {
  const { session } = readSessionState()
  const selectedStore = selectSelectedStore(readStoreSelectionState())
  return session && selectedStore ? { session, selectedStore } : null
}
