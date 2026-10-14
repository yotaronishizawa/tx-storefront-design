import { stopOpm } from "~/api/opm"
import { clearOperatorScope } from "~/config/error-reporting"

import { resetAppShellStore } from "./app-shell"
import { resetOperationsStore } from "./operations"
import { resetRestockingStore } from "./restocking"
import { resetRobotStore } from "./robot"
import { clearStoredSession, readSessionState } from "./session"
import { resetShelfStore } from "./shelf"
import { resetStoreSelectionStore } from "./store-selection"

/**
 * Ends the shift: stored session, session state, every other domain store, and
 * the OPM connection (the local shelf hub stays, as in the store app). Lives
 * above every domain to reach them all, and is a plain function so the SignalR
 * reauth callback can call it.
 */
export function signOutSession(): void {
  clearOperatorScope()
  clearStoredSession()
  readSessionState().signOut()
  resetDomainStores()
  void stopOpm()
}

/** Every domain store but session, which `signOut()` clears. */
function resetDomainStores() {
  resetAppShellStore()
  resetOperationsStore()
  resetRestockingStore()
  resetRobotStore()
  resetShelfStore()
  resetStoreSelectionStore()
}
