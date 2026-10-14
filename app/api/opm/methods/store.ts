import type { AuthRequest, OpmInput } from "../__generated__/opm-rpc"
import { call, opmHub } from "../client"
import {
  createActiveStoreRequestFilters,
  readAgent,
  readRequestContexts,
  readSignInResult,
  readSkuRecommendations,
  readSkus,
  readStores,
  type SkuRecommendationCounts,
  type Store,
} from "../schemas"

/** Sign-in is the one method outside `Call`: there is no token yet. */
export async function signIn(agentId: string, password: string) {
  const request: OpmInput<AuthRequest> = { agentId, password }
  return readSignInResult(await opmHub.invoke("SignInWithID", request))
}

export async function getAgent(agentId: string, token: string) {
  return readAgent(await call("GetAgent", [agentId], token))
}

export async function getStores(agentId: string, token: string) {
  return readStores(await call("GetStores", [agentId], token))
}

/** A store without a type has no catalogue to load. */
export async function getSkus(storeType: Store["storeType"], token: string) {
  if (storeType === undefined) {
    return []
  }
  return readSkus(await call("GetSkus", [storeType], token))
}

export async function getActiveStoreRequests(storeId: string, token: string) {
  return readRequestContexts(
    await call(
      "GetFilteredRequestContextsPaginated",
      [createActiveStoreRequestFilters(storeId), 0, 10],
      token
    )
  )
}

export async function getSkuRecommendations(storeId: string, token: string) {
  return readSkuRecommendations(
    await call("GetSkuRecommendations", [storeId], token)
  )
}

export async function setSkuRecommendations(
  storeId: string,
  recommendations: SkuRecommendationCounts,
  token: string
): Promise<boolean> {
  const result = await call(
    "SetSkuRecommendations",
    [storeId, { recommendations }],
    token
  )
  return result !== false
}

export async function canCancelShelfLayoutChangeRequest(
  storeId: string,
  token: string
): Promise<boolean> {
  return (
    (await call("CanCancelShelfLayoutChangeRequest", [storeId], token)) === true
  )
}

/** Also cancels the linked layout check and restock. */
export async function cancelShelfLayoutChangeRequest(
  requestId: string,
  storeId: string,
  agentId: string,
  token: string
): Promise<boolean> {
  return (
    (await call(
      "CancelShelfLayoutChangeRequest",
      [requestId, storeId, agentId],
      token
    )) === true
  )
}
