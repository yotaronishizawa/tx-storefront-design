import { getWorkflowRequest } from "~/api/opm"
import { readSessionState } from "~/domains/session"
import { readStoreSelectionState } from "~/domains/store-selection"

/** Absence from a paginated active list is not proof that another operator ended MR. */
export async function verifyManualRequestClosed(
  requestId: string
): Promise<boolean> {
  const { session } = readSessionState()
  const storeId = readStoreSelectionState().selectedStoreId
  if (!session || !storeId || !requestId) return false
  const request = await getWorkflowRequest(requestId, session.token)
  return (
    readSessionState().session?.token === session.token &&
    readStoreSelectionState().selectedStoreId === storeId &&
    request.requestId === requestId &&
    request.storeId === storeId &&
    request.requestType === "ManualReplenishment" &&
    (request.status === "Closed" || request.status === "Cancelled")
  )
}
