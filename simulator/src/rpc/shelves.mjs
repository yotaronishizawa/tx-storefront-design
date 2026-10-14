/*
 * Shelf layout, drinks and recommendations: the display shelf (front of store)
 * and the stock shelf (lanes the operator restocks).
 */
import { findStockLocation } from "../model/lanes.mjs"
import {
  addRequest,
  findActiveRequest,
  findRequest,
  REQUEST_STATUS,
  REQUEST_TYPE,
} from "../model/requests.mjs"
import { DRINK_REMOVAL_MODES, DRINK_REMOVAL_STATUSES } from "../model/robot.mjs"
import { state } from "../state.mjs"
import { randomUUID } from "../utils/id.mjs"
import { unixSeconds, unixSecondsDaysAgo } from "../utils/time.mjs"
import { HubException, withErrors } from "./define.mjs"
import {
  REMOVE_SKUS_FROM_STOCK_RESULTS,
  START_SHELF_LAYOUT_ERRORS,
} from "./errors.mjs"

// `ShelfType`: 0 DisplayShelf, 1 StockShelf, by number or name.
const STOCK_SHELF = new Set([1, "StockShelf"])
// `OperatorTaskName.DisplayShelfAnnotation`.
const DISPLAY_SHELF_ANNOTATION = 0

export const shelfMethods = {
  GetDisplayShelfSpecification: () => state.displaySpec,
  GetStockShelfSpecification: () => state.stockSpec,
  GetDisplayShelfLocations: () => state.displayLocations,
  GetStockShelfLocations: () => state.stockLocations,
  GetSkus: () => state.skus,

  // `GetStockShelvesActions` (`IStoreAppService`) is not here: the app never calls it.
  // Answers a bare `RemoveSkusFromStockResult` number.
  RemoveSkusFromStock: withErrors(
    ([, locationId, removals]) =>
      removeSkusFromStock(String(locationId ?? ""), removals),
    REMOVE_SKUS_FROM_STOCK_RESULTS,
    (error) => error
  ),

  GetSkuRecommendations: () => {
    switch (state.recommendationsAnswer) {
      case "null":
        return null
      case "null-list":
        return { updatedTime: 0, recommendations: null }
      default:
        return { recommendations: state.recommendationCounts }
    }
  },
  SetSkuRecommendations: ([, request]) => {
    state.recommendationCounts = {
      ...(request?.recommendations ?? request ?? {}),
    }
    state.recommendationsAnswer = "list"
    return true
  },

  // `StoreUsecase.GetCabinets`: the spec's cabinets with the layout images a
  // store uploaded. The simulator stores no image, so `imagePng` is `null`.
  GetCabinets: ([, shelfType]) =>
    (STOCK_SHELF.has(shelfType)
      ? state.stockSpec
      : state.displaySpec
    ).cabinets.map(toCabinet),
  // `StoreUsecase.SetCabinetInfo`: replaces one cabinet's layouts. Refused
  // while an operator is annotating the display shelf. Answers nothing.
  SetCabinetInfo: ([, cabinetIndex, layouts, shelfType]) => {
    if (
      state.operatorTasks.some(
        (task) => Number(task.taskName) === DISPLAY_SHELF_ANNOTATION
      )
    ) {
      throw new HubException("Display shelf annotation is in progress.")
    }
    const key = `${STOCK_SHELF.has(shelfType) ? "stock" : "display"}-${Number(cabinetIndex)}`
    state.cabinetLayouts[key] = (Array.isArray(layouts) ? layouts : []).map(
      (layout) => ({ ...layout, imagePng: null })
    )
    return null
  },

  GetLocationHistory: ([, , days]) => ({
    histories: state.displayHistoryLocations,
    bkTimestamp: unixSecondsDaysAgo(Number(days ?? 1)),
  }),

  // Registration and capture are distinct. A registered layout may still need capture.
  // A layout request stays open until restocking ends or the robot restarts.
  StartShelfLayoutChangeRequest: withErrors(
    (args) => {
      const response = startShelfLayoutChange(args)
      if (response.error === 0) {
        applyDisplayLayout(args[1])
      }
      return response
    },
    START_SHELF_LAYOUT_ERRORS,
    (error) => ({ error, requestContext: null })
  ),
  StartShelfLayoutChangeRequestV2: withErrors(
    startShelfLayoutChange,
    START_SHELF_LAYOUT_ERRORS,
    (error) => ({ error, requestContext: null })
  ),
  // `ChangedShelfStats` (`JobManager/Entities/Location.cs:348`); no error enum.
  ChangeDisplayShelfLocations: () => ({
    isFailureToGenerateStock: false,
    detectionResult: {
      existOnlyOnDisplayIds: [],
      existOnlyOnStockIds: [],
      invalidBottomReachabilityStockIds: [],
      invalidTopReachabilityStockIds: [],
      invalidFlipStockIds: [],
      moreDisplaySkusThanStockLocations: false,
    },
  }),
}

// `StartShelfLayoutResponse`: `{ error, requestContext }`, the context a
// `ShelfLayoutRequest` (`Task/Entities/RequestContext.cs:245`). OPM ignores
// `isCaptureRequired` in both versions (`TXOperationService.RequestContext.cs:469,477`).
function startShelfLayoutChange([storeId, locations, isCaptureRequired]) {
  if (state.layoutOutcome === "reject")
    return { error: 2, requestContext: null }
  if (state.layoutOutcome === "unreadable") return { simulatorUnreadable: true }
  const submitted = Array.isArray(locations)
    ? locations.flatMap((item) =>
        item.rows ? item.rows.flatMap((row) => row.locations ?? []) : [item]
      )
    : []
  // `CreateSpecificRequestContext` allows one open layout change per store.
  if (findActiveRequest(REQUEST_TYPE.shelfLayoutChange)) {
    return { error: 2, requestContext: null }
  }

  const requestContext = addRequest({
    requestId: `SIM-LAYOUT-${unixSeconds()}`,
    storeId: String(storeId ?? ""),
    requestType: REQUEST_TYPE.shelfLayoutChange,
    fields: {
      requiredCapture: Boolean(isCaptureRequired),
      captureJobPublished: null,
      captureJobId: null,
      description: "",
      // Snapshots, so later lane patches leave the layout the change started from intact.
      initialStockShelfLocations: structuredClone(state.stockLocations),
      editableStockShelfLocations: state.stockLocations,
      initialDisplayShelfLocations: structuredClone(state.displayLocations),
      editableDisplayShelfLocations: submitted,
    },
  })
  if (state.layoutOutcome === "allocation-error")
    return { error: 1, requestContext }
  const next = structuredClone(submitted).map((location) => ({
    ...location,
    id: /^destination_id_/.test(location.id ?? "")
      ? location.id
      : `destination_id_${randomUUID()}`,
  }))
  if (state.layoutOutcome === "defer") state.pendingDisplayLocations = next
  else {
    state.displayHistoryLocations = structuredClone(state.displayLocations)
    state.displayLocations = next
  }
  return {
    error: state.layoutOutcome === "apply-warning" ? 1 : 0,
    requestContext,
  }
}

/** The storefront sends every row, so the sent lanes become the layout. */
function applyDisplayLayout(cabinets) {
  const sent = (Array.isArray(cabinets) ? cabinets : []).flatMap((cabinet) =>
    (cabinet.rows ?? []).flatMap((row) => row.locations ?? [])
  )
  if (sent.length > 0) {
    state.displayLocations = sent
  }
}

/** `Cabinet` (`Operation/Entities/Cabinet.cs`) from a spec cabinet. */
function toCabinet(cabinet) {
  const kind = state.stockSpec.cabinets.includes(cabinet) ? "stock" : "display"
  return {
    index: cabinet.index,
    maxPosX: cabinet.maxPosX ?? 0,
    minPosX: cabinet.minPosX ?? 0,
    maxPosZ: cabinet.maxPosZ ?? 0,
    curtainId: cabinet.curtainId ?? 0,
    layoutInfo: null,
    rowInfo: [],
    cabinetLayouts: state.cabinetLayouts[`${kind}-${cabinet.index}`] ?? [],
    edgePaddingAft: 2,
    edgePaddingForward: 2,
  }
}

// OPM's `CheckIfCanRemoveSku` as a `RemoveSkusFromStockResult`, which
// `RemoveSkusFromStock` runs after validating the removals and before reading
// the lane, including the study simulator queued-job condition.
function removalRefusal() {
  if (
    findRequest(state.currentRestockingId)?.status === REQUEST_STATUS.inProgress
  ) {
    return 6
  }
  if (!DRINK_REMOVAL_MODES.includes(Number(state.robot.opMode))) {
    return 5
  }
  if (!DRINK_REMOVAL_STATUSES.includes(Number(state.robot.status))) {
    return 7
  }
  if (state.queuedJobCount > 0) return 8
  return 0
}

// Returns `RemoveSkusFromStockResult`; accepts `{ Item1, Item2 }` or `{ skuIndex, skuId }` per removal.
function removeSkusFromStock(locationId, removals) {
  const items = (Array.isArray(removals) ? removals : []).map((item) => ({
    skuIndex: Number(item?.Item1 ?? item?.item1 ?? item?.skuIndex ?? -1),
    skuId: String(item?.Item2 ?? item?.item2 ?? item?.skuId ?? ""),
  }))
  if (
    items.length === 0 ||
    items.some((item) => item.skuIndex < 0 || !item.skuId)
  ) {
    return 2
  }
  const refusal = removalRefusal()
  if (refusal) {
    return refusal
  }
  const location = findStockLocation(locationId)
  if (!location) {
    return 3
  }
  if (items.some((item) => location.skuIds[item.skuIndex] !== item.skuId)) {
    return 4
  }

  const removed = new Set(items.map((item) => item.skuIndex))
  const keep = (_, index) => !removed.has(index)
  location.skuIds = location.skuIds.filter(keep)
  location.skuEntries = (location.skuEntries ?? []).filter(keep)
  location.skuId = location.skuIds[0] ?? ""
  return 0
}
