import {
  LocationStatusType,
  LocationType,
  type CabinetShelfLocation,
  type OpmInput,
} from "../__generated__/opm-rpc"
import { call } from "../client"
import {
  readForceDiscrepancyResolutionResponse,
  readRemoveSkusFromStockResult,
  readShelfLocationHistory,
  readShelfLocations,
  readShelfLocationsStrict,
  readShelfSpec,
  readStartShelfLayoutResult,
  readStoreMirrored,
  type ShelfLocationHistory,
  type StockDrinkRemoval,
} from "../schemas"

/** V2 defers registration. Never fall back to an immediate or duplicate write. */
export async function startShelfLayoutChangeRequest(
  storeId: string,
  locations: OpmInput<CabinetShelfLocation>[],
  needCapture: boolean,
  token: string
) {
  return readStartShelfLayoutResult(
    await call(
      "StartShelfLayoutChangeRequestV2",
      [storeId, locations, needCapture],
      token
    )
  )
}

/** Readback used to decide whether a submitted layout has registered. */
export async function getRegisteredDisplayShelfLocations(
  storeId: string,
  token: string
) {
  return readShelfLocationsStrict(
    await call(
      "GetDisplayShelfLocations",
      [storeId, LocationStatusType.All],
      token
    )
  )
}

export async function getDisplayShelfSpecification(
  storeId: string,
  token: string
) {
  return readShelfSpec(
    await call("GetDisplayShelfSpecification", [storeId], token)
  )
}

export async function getStockShelfSpecification(
  storeId: string,
  token: string
) {
  return readShelfSpec(
    await call("GetStockShelfSpecification", [storeId], token)
  )
}

export async function getStoreMirrored(storeId: string, token: string) {
  return readStoreMirrored(
    await call("GetStoreSpecification", [storeId], token)
  )
}

export async function getDisplayShelfLocations(storeId: string, token: string) {
  return readShelfLocations(
    await call(
      "GetDisplayShelfLocations",
      [storeId, LocationStatusType.All],
      token
    )
  )
}

export async function getStockShelfLocations(storeId: string, token: string) {
  return readShelfLocations(
    await call(
      "GetStockShelfLocations",
      [storeId, LocationStatusType.All],
      token
    )
  )
}

/** The last five display layouts, newest first; one that fails to load is left out. */
export async function getDisplayShelfLocationHistories(
  storeId: string,
  token: string
): Promise<ShelfLocationHistory[]> {
  const histories = await Promise.all(
    [1, 2, 3, 4, 5].map((previous) =>
      call(
        "GetLocationHistory",
        [storeId, LocationType.DisplayShelf, previous],
        token
      )
        .then(readShelfLocationHistory)
        .catch(() => null)
    )
  )
  return histories.filter((history) => history !== null)
}

/** Turns every display and stock lane back on. */
export async function setAllShelfLanesAvailable(
  storeId: string,
  token: string
): Promise<void> {
  for (const locationType of [
    LocationType.DisplayShelf,
    LocationType.StockShelf,
  ]) {
    await call(
      "SwitchShelfLocationIsAvailable",
      [storeId, true, locationType],
      token
    )
  }
}

/** OPM answers `DifferentSkuId` when the drink at `skuIndex` has changed. */
export async function removeSkusFromStock(
  storeId: string,
  locationId: string,
  removals: StockDrinkRemoval[],
  token: string
) {
  // OPM takes `(int skuIndex, string skuId)[]`, a tuple the hub reads as `{ item1, item2 }`.
  const result = await call(
    "RemoveSkusFromStock",
    [
      storeId,
      locationId,
      removals.map(({ skuId, skuIndex }) => ({
        item1: skuIndex,
        item2: skuId,
      })),
    ],
    token
  )
  return readRemoveSkusFromStockResult(result)
}

export async function forceDiscrepancyResolution(
  storeId: string,
  locationId: string,
  token: string
) {
  return readForceDiscrepancyResolutionResponse(
    await call("ForceDiscrepancyResolution", [{ locationId, storeId }], token)
  )
}

/** Turns a stock lane back on after an operator cleared what stopped the robot picking from it. */
export async function setStockLaneAvailable(
  storeId: string,
  locationId: string,
  token: string
): Promise<void> {
  await call(
    "PatchLocation",
    [
      storeId,
      locationId,
      {
        isAvailable: true,
        skuId: null,
        slot: null,
        isRequiredScan: null,
        isBlackList: null,
        priorities: null,
        isForceSetPriority: null,
        unusedType: null,
      },
    ],
    token
  )
}
