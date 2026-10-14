import type {
  OpmLocationError,
  OpmLocationState,
  OpmShelfLocation,
  OpmStockSkuChange,
  SkuEntry,
} from "~/api/opm/schemas"
import type { StockShelfLaneUpdate } from "~/api/stock-shelf"

/** The local hub's event types; OPM's updates are given one by `fromOpmStockSkuChange`. */
type LaneEventType = "Add" | "Error" | "Fix" | "Remove" | "SnapShot"

/** `laneErrorType` of a drink too big for its lane. */
export const DRINK_CONSTRAINT_ERROR = "DrinkConstraint"

/** One lane error. `discrepancyCause` and `reasons` hold OPM enum names; `lane-error.ts` turns them into codes. */
export type LaneError = {
  laneErrorType: string
  discrepancyCause: string
  reasons: string[]
  skuErrors: string[]
}

/** One lane's state after an update from either hub. */
export type LaneUpdate = {
  locationId: string
  /** -1 when OPM sent it; only the local hub knows the hardware cell. */
  hardwareCellIndex: number
  laneEventType: LaneEventType
  /** The lane's full contents after the event, not a delta. */
  skuIds: string[]
  /** `undefined` keeps the errors the lane already has. */
  errorsInfo?: LaneError[]
  /** Only OPM's updates carry these; see `alignLaneSkuEntries` for when `skuEntries` is used. */
  changedSkuId?: string
  eventId?: string
  skuEntries?: SkuEntry[]
}

/** A display or stock lane, with what the latest lane update said about it. */
export type ShelfLocation = OpmShelfLocation &
  Partial<Pick<LaneUpdate, "hardwareCellIndex" | "laneEventType">> & {
    laneErrors?: LaneError[]
  }

export function fromStockShelfLaneUpdate(
  update: StockShelfLaneUpdate
): LaneUpdate {
  return {
    locationId: update.locationId,
    hardwareCellIndex: update.hardwareCellIndex,
    laneEventType: update.laneEventType,
    skuIds: update.skuIds,
    // The hub's snapshot never carries errors, so its empty list would wipe
    // the ones OPM reported.
    errorsInfo:
      update.laneEventType === "SnapShot" ? undefined : update.errorsInfo,
  }
}

/** `undefined` for a change OPM flags `None`: a weight-report workaround, not a lane event. */
export function fromOpmStockSkuChange(
  change: OpmStockSkuChange
): LaneUpdate | undefined {
  if (change.error === "None") {
    return undefined
  }
  return {
    locationId: change.locationId,
    hardwareCellIndex: -1,
    laneEventType: opmLaneEventType(change),
    skuIds: change.skuIds,
    errorsInfo: change.errors.map(fromOpmLocationError),
    changedSkuId: change.changedSkuId,
    eventId: change.eventId,
    skuEntries: change.skuEntries,
  }
}

export function fromOpmLocationState(state: OpmLocationState): LaneUpdate {
  return {
    locationId: state.locationId,
    hardwareCellIndex: -1,
    laneEventType: "SnapShot",
    skuIds: state.skuIds,
    errorsInfo: state.errors.map(fromOpmLocationError),
    skuEntries: state.skuEntries,
  }
}

/** A discrepancy's code is its `discrepancyCause`; see `getLaneErrorDetails`. */
export function fromOpmLocationError({
  cause,
  invalidSkuId,
  reasons,
}: OpmLocationError): LaneError {
  return {
    laneErrorType: opmLaneErrorType(invalidSkuId, cause),
    discrepancyCause: cause ?? "",
    reasons: invalidSkuId ? reasons : [],
    skuErrors: invalidSkuId ? [invalidSkuId] : [],
  }
}

/** OPM sends no event type; an error wins, then the direction of the count change. */
function opmLaneEventType(change: OpmStockSkuChange): LaneEventType {
  if (change.error !== undefined) {
    return "Error"
  }
  if (change.skuCountDiff > 0) {
    return "Add"
  }
  if (change.skuCountDiff < 0) {
    return "Remove"
  }
  if (change.errors.length > 0) {
    return "Error"
  }
  return "SnapShot"
}

/** Only an `InvalidSkuError` has an `invalidSkuId`, only a `DiscrepancyError` a `cause`. */
function opmLaneErrorType(invalidSkuId: string, cause: string | undefined) {
  if (invalidSkuId) {
    return DRINK_CONSTRAINT_ERROR
  }
  if (cause) {
    return "DrinkDiscrepancy"
  }
  return "Unknown"
}

/** A lane update for a log line: everything but the errors, which are counted. */
export function summarizeLaneUpdate({ errorsInfo, ...update }: LaneUpdate) {
  return { ...update, errorsCount: errorsInfo?.length }
}
