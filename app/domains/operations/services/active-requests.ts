import { getWorkflowRequests } from "~/api/opm"
import { readSessionState } from "~/domains/session"
import {
  readStoreContext,
  readStoreSelectionState,
  selectSelectedStore,
} from "~/domains/store-selection"

import { readOperationsState } from "../operations-store"

/**
 * Re-reads the open requests. Session and store are read at call time, and the
 * result is dropped if the operator changed store while it was in flight.
 */
export async function refreshRequests(): Promise<void> {
  const context = readStoreContext()
  if (!context) {
    return
  }

  const storeId = context.selectedStore.id
  const nextRequests = await getWorkflowRequests(storeId, context.session.token)

  const currentStore = selectSelectedStore(readStoreSelectionState())
  if (
    !currentStore ||
    currentStore.id !== storeId ||
    readSessionState().session?.token !== context.session.token
  ) {
    return
  }

  readOperationsState().setRequests(nextRequests)
}
