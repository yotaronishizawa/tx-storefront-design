import {
  getDisplayShelfLocationHistories,
  getDisplayShelfSpecification,
  getRegisteredDisplayShelfLocations,
  getSkuRecommendations,
  getSkus,
  getStockShelfLocations,
  getStockShelfSpecification,
  getStoreMirrored,
  getWorkflowRequests,
} from "~/api/opm"
import type { Store } from "~/api/opm/schemas"
import { readOperationsState } from "~/domains/operations"

import { readShelfState } from "../shelf-store"
import { applyRegisteredLayout } from "./layout-registration"

type Resolved<F extends (...args: never[]) => unknown> = Awaited<ReturnType<F>>

/** SKUs and shelf specifications: read when a store loads, not on a refresh. */
type StoreCatalog = {
  skus: Resolved<typeof getSkus>
  displaySpec: Resolved<typeof getDisplayShelfSpecification> | null
  stockSpec: Resolved<typeof getStockShelfSpecification> | null
  storeMirrored: boolean
}

type StoreSnapshot = {
  storeId: string
  requests: Resolved<typeof getWorkflowRequests>
  displayLocations: Resolved<typeof getRegisteredDisplayShelfLocations>
  stockLocations: Resolved<typeof getStockShelfLocations>
  /** `null` when the list could not be read. */
  recommendationCounts: NonNullable<
    Resolved<typeof getSkuRecommendations>
  > | null
  displayHistories: Resolved<typeof getDisplayShelfLocationHistories>
  /** `null` unless `includeCatalog` was asked for. */
  catalog: StoreCatalog | null
}

type Optional = <T>(request: Promise<T>, fallback: T) => Promise<T>

type FetchStoreSnapshotOptions = {
  store: Store
  token: string
  includeCatalog: boolean
  /** Called once for each optional read that failed and fell back. */
  onOptionalFailure?: () => void
}

/**
 * Reads the store in one parallel batch. Requests and shelf locations are
 * required and reject the whole batch; every other read falls back instead.
 */
export async function fetchStoreSnapshot({
  store,
  token,
  includeCatalog,
  onOptionalFailure,
}: FetchStoreSnapshotOptions): Promise<StoreSnapshot> {
  const optional: Optional = (request, fallback) =>
    request.catch(() => {
      onOptionalFailure?.()
      return fallback
    })

  const storeId = store.id
  // An unreadable list counts as a failed read, like a rejected one.
  const recommendations = getSkuRecommendations(storeId, token).then(
    (counts) => {
      if (!counts) {
        throw new Error("unreadable SKU recommendations")
      }
      return counts
    }
  )

  const [
    requests,
    catalog,
    displayLocations,
    stockLocations,
    recommendationCounts,
    displayHistories,
  ] = await Promise.all([
    getWorkflowRequests(storeId, token),
    includeCatalog ? fetchStoreCatalog(store, token, optional) : null,
    getRegisteredDisplayShelfLocations(storeId, token),
    getStockShelfLocations(storeId, token),
    optional(recommendations, null),
    optional(getDisplayShelfLocationHistories(storeId, token), []),
  ])

  return {
    catalog,
    displayHistories,
    displayLocations,
    recommendationCounts,
    requests,
    stockLocations,
    storeId,
  }
}

async function fetchStoreCatalog(
  store: Store,
  token: string,
  optional: Optional
): Promise<StoreCatalog> {
  const [skus, displaySpec, stockSpec, storeMirrored] = await Promise.all([
    optional(getSkus(store.storeType, token), []),
    optional(getDisplayShelfSpecification(store.id, token), null),
    optional(getStockShelfSpecification(store.id, token), null),
    optional(getStoreMirrored(store.id, token), false),
  ])
  return { displaySpec, skus, stockSpec, storeMirrored }
}

type ApplyStoreSnapshotOptions = {
  /**
   * `"keep"` leaves the counts already shown. `"fail"` marks the list unread,
   * which keeps it unsaveable: saving would replace OPM's whole list.
   */
  unreadRecommendations: "keep" | "fail"
}

/** Writes a snapshot into the operations and shelf stores. */
export function applyStoreSnapshot(
  snapshot: StoreSnapshot,
  { unreadRecommendations }: ApplyStoreSnapshotOptions
) {
  readOperationsState().setRequests(snapshot.requests)

  const shelf = readShelfState()
  if (snapshot.catalog) {
    shelf.setSkus(snapshot.catalog.skus)
    shelf.setDisplaySpec(snapshot.catalog.displaySpec)
    shelf.setStockSpec(snapshot.catalog.stockSpec)
    shelf.setStoreMirrored(snapshot.catalog.storeMirrored)
  }
  applyRegisteredLayout(snapshot.storeId, snapshot.displayLocations)
  shelf.setDisplayHistories(snapshot.displayHistories)
  shelf.setStockLocations(snapshot.stockLocations)
  if (snapshot.recommendationCounts) {
    shelf.setRecommendationCounts(
      snapshot.recommendationCounts,
      snapshot.storeId
    )
  } else if (unreadRecommendations === "fail") {
    shelf.failRecommendationCountsRead()
  }
}
