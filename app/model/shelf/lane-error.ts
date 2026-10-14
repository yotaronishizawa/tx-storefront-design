import type {
  DiscrepancyCauseName,
  InvalidSkuReasonName,
} from "~/api/opm/schemas"

import {
  DRINK_CONSTRAINT_ERROR,
  type LaneError,
  type ShelfLocation,
} from "./lane-update"
import {
  getLocationLaneErrors,
  getLocationLaneIssue,
  isLocationBlocked,
} from "./location"

/** OPM's `DiscrepancyCause` names, plus codes for an oversized drink and two fallbacks. */
type LaneErrorCode =
  | DiscrepancyCauseName
  | "LaneWithHeightError"
  | "LaneWithWidthError"
  | "SelectedLaneEmpty"
  | "UnknownError"

/** Width is reason 1 but code 2. */
const INVALID_SKU_REASON_CODES = {
  IncompatibleWidth: "LaneWithWidthError",
  IncompatibleHeight: "LaneWithHeightError",
} as const satisfies Record<InvalidSkuReasonName, LaneErrorCode>

/** The `S0006xx` code the operator reads out to support; support shares these across apps, so they must not change. */
const LANE_ERROR_CODE_NUMBERS = {
  LaneWithHeightError: "S000601",
  LaneWithWidthError: "S000602",
  PlacedWithoutScanning: "S000603",
  RemovedWithoutScanning: "S000604",
  RemovedSkuFromOtherSession: "S000605",
  RestockingDiscrepancy: "S000606",
  RobotOperationDiscrepancy: "S000607",
  SelectedLaneEmpty: "S000698",
  UnknownError: "S000699",
} as const satisfies Record<LaneErrorCode, string>

const LANE_ERROR_MESSAGE_KEYS = {
  LaneWithHeightError: "laneErrorTooTall",
  LaneWithWidthError: "laneErrorTooWide",
  PlacedWithoutScanning: "laneErrorPlacedWithoutScanning",
  RemovedWithoutScanning: "laneErrorRemovedWithoutScanning",
  RemovedSkuFromOtherSession: "laneErrorRemovedOtherSession",
  RestockingDiscrepancy: "laneErrorRestockingDiscrepancy",
  RobotOperationDiscrepancy: "laneErrorRobotDiscrepancy",
  SelectedLaneEmpty: "laneErrorLaneEmpty",
  UnknownError: "laneErrorUnknown",
} as const satisfies Record<LaneErrorCode, string>

/** One line of the lane-error notice. Literal unions, so `t()` still checks the key. */
type LaneErrorDetail = {
  code: (typeof LANE_ERROR_CODE_NUMBERS)[LaneErrorCode]
  messageKey: (typeof LANE_ERROR_MESSAGE_KEYS)[LaneErrorCode]
}

/**
 * The distinct problems on a lane, deduped by code. `UnknownError` appears only
 * when nothing specific does, so every red lane names a code.
 *
 * @example getLaneErrorDetails([]) // [{ code: "S000699", messageKey: "laneErrorUnknown" }]
 */
function getLaneErrorDetails(errors: LaneError[]): LaneErrorDetail[] {
  const codes = new Set(errors.flatMap(getErrorCodes))
  if (codes.size > 1) {
    codes.delete("UnknownError")
  }
  if (codes.size === 0) {
    codes.add("UnknownError")
  }

  return [...codes].map((code) => ({
    code: LANE_ERROR_CODE_NUMBERS[code],
    messageKey: LANE_ERROR_MESSAGE_KEYS[code],
  }))
}

/**
 * An error's codes from its `reasons`, else from its discrepancy cause, which
 * is the only place OPM puts a discrepancy's code.
 */
function getErrorCodes(error: LaneError): LaneErrorCode[] {
  const fromReasons = error.reasons.map(reasonToCode).filter(isLaneErrorCode)
  if (fromReasons.length > 0) {
    return fromReasons
  }
  return isLaneErrorCode(error.discrepancyCause) ? [error.discrepancyCause] : []
}

/** A reason is a `DiscrepancyCause` name, or an `InvalidSkuReason` name mapped to its code. */
function reasonToCode(reason: string): string {
  if (reason in INVALID_SKU_REASON_CODES) {
    return INVALID_SKU_REASON_CODES[reason as InvalidSkuReasonName]
  }
  return reason
}

function isLaneErrorCode(value: string): value is LaneErrorCode {
  return value in LANE_ERROR_CODE_NUMBERS
}

export type LaneErrorBlock = {
  constraintLaneIds: string[]
  unscannedLaneIds: string[]
}

/**
 * Lanes that block restocking: an oversized drink blocks scans, Start and End;
 * a drink placed without scanning blocks scans only. Blacklisted lanes never block.
 */
export function getLaneErrorBlock(locations: ShelfLocation[]): LaneErrorBlock {
  const constraintLaneIds: string[] = []
  const unscannedLaneIds: string[] = []
  for (const location of locations) {
    if (isLocationBlocked(location)) {
      continue
    }
    const errors = getLocationLaneErrors(location)
    if (errors.some(isConstraintError)) {
      constraintLaneIds.push(location.id)
    } else if (errors.some(isPlacedWithoutScanningError)) {
      unscannedLaneIds.push(location.id)
    }
  }
  return { constraintLaneIds, unscannedLaneIds }
}

/** Any lane error on a non-blacklisted lane, blocking or not. */
export function hasLaneErrors(locations: ShelfLocation[]): boolean {
  return locations.some(
    (location) =>
      !isLocationBlocked(location) && getLocationLaneErrors(location).length > 0
  )
}

export function blocksScan(block: LaneErrorBlock): boolean {
  return block.constraintLaneIds.length > 0 || block.unscannedLaneIds.length > 0
}

export function blocksRestockingStartOrEnd(block: LaneErrorBlock): boolean {
  return block.constraintLaneIds.length > 0
}

/** A drink too big for its lane. */
export function isConstraintError(error: LaneError): boolean {
  return error.laneErrorType === DRINK_CONSTRAINT_ERROR
}

/** A drink placed in the lane without being scanned first. */
export function isPlacedWithoutScanningError(error: LaneError): boolean {
  return (
    error.discrepancyCause === "PlacedWithoutScanning" ||
    error.reasons.includes("PlacedWithoutScanning")
  )
}

/**
 * For a store with no shelf client, keeps only oversized-drink errors, since
 * nothing can show a discrepancy was fixed.
 */
export function keepConstraintLaneErrors(
  locations: ShelfLocation[]
): ShelfLocation[] {
  return locations.map((location) => {
    const errors = getLocationLaneErrors(location)
    const constraints = errors.filter(isConstraintError)
    if (constraints.length === errors.length) {
      return location
    }
    return { ...location, laneErrors: constraints }
  })
}

/** The higher, the sooner the lane is fixed. */
export function getLaneErrorPriority(location: ShelfLocation): number {
  const errors = getLocationLaneErrors(location)
  if (errors.some(isConstraintError)) {
    return 3
  }
  if (errors.some(isPlacedWithoutScanningError)) {
    return 2
  }
  return 1
}

/** A red lane: one with an error, unless blacklisted. Unused lanes count. */
function isErrorLane(location: ShelfLocation): boolean {
  return !isLocationBlocked(location) && Boolean(getLocationLaneIssue(location))
}

/**
 * The red lanes, most urgent first: oversized drink, then placed without
 * scanning, then any other discrepancy. Ties go to the lane that went red
 * first (`seenOrder`), then to shelf order.
 */
export function getErrorLaneIds(
  locations: ShelfLocation[],
  seenOrder: ReadonlyMap<string, number> = new Map()
): string[] {
  return locations
    .filter(isErrorLane)
    .map((location, index) => ({
      id: location.id,
      rank: getLaneErrorPriority(location),
      seen: seenOrder.get(location.id) ?? Number.MAX_SAFE_INTEGER,
      index,
    }))
    .sort(
      (left, right) =>
        right.rank - left.rank ||
        left.seen - right.seen ||
        left.index - right.index
    )
    .map(({ id }) => id)
}

/**
 * When each red lane went red, as an increasing number: lanes still red keep
 * theirs, newly red ones are numbered after them, cleared ones are dropped.
 *
 * @example nextLaneErrorSeenOrder(new Map([["a", 1]]), [redA, redB]) // Map { "a" => 1, "b" => 2 }
 */
export function nextLaneErrorSeenOrder(
  previous: ReadonlyMap<string, number>,
  locations: ShelfLocation[]
): ReadonlyMap<string, number> {
  const next = new Map<string, number>()
  let last = Math.max(0, ...previous.values())
  for (const location of locations) {
    if (!isErrorLane(location)) {
      continue
    }
    next.set(location.id, previous.get(location.id) ?? ++last)
  }
  const unchanged =
    next.size === previous.size &&
    [...next].every(([id, order]) => previous.get(id) === order)
  return unchanged ? previous : next
}

export type LaneErrorPrompt = {
  details: LaneErrorDetail[]
  /** Changes whenever the set of blocking lanes does, so the popup shows again. */
  key: string
  kind: "constraint" | "unscanned"
}

/**
 * The popup a blocking lane error raises: an oversized drink takes precedence
 * over one placed without scanning.
 *
 * @example getLaneErrorPrompt({ constraintLaneIds: [], unscannedLaneIds: [] }, []) // null
 */
export function getLaneErrorPrompt(
  block: LaneErrorBlock,
  locations: ShelfLocation[]
): LaneErrorPrompt | null {
  if (!blocksScan(block)) {
    return null
  }

  const { constraintLaneIds, unscannedLaneIds } = block
  const isConstraint = constraintLaneIds.length > 0
  const laneIds = new Set(isConstraint ? constraintLaneIds : unscannedLaneIds)
  const matchesKind = isConstraint
    ? isConstraintError
    : isPlacedWithoutScanningError
  const errors = locations
    .filter((location) => laneIds.has(location.id))
    .flatMap(getLocationLaneErrors)
    .filter(matchesKind)

  return {
    details: getLaneErrorDetails(errors),
    key: `${sortedIdList(constraintLaneIds)}|${sortedIdList(unscannedLaneIds)}`,
    kind: isConstraint ? "constraint" : "unscanned",
  }
}

function sortedIdList(ids: string[]): string {
  return [...ids].sort().join(",")
}

export type LaneErrorSummary = {
  details: LaneErrorDetail[]
  kind: "" | "constraint" | "discrepancy"
  /** Drinks a size constraint rejects, so the panel can mark them. */
  wrongSkuIds: ReadonlySet<string>
}

/**
 * What the lane panel says about one lane's errors; a too-big drink outranks
 * a discrepancy, and a blocked lane has none.
 *
 * @example getLaneErrorSummary(undefined) // { details: [], kind: "", wrongSkuIds: new Set() }
 */
export function getLaneErrorSummary(
  location: ShelfLocation | null | undefined
): LaneErrorSummary {
  if (!location || isLocationBlocked(location)) {
    return noLaneErrorSummary()
  }
  const errors = getLocationLaneErrors(location)
  const constraints = errors.filter(isConstraintError)
  if (constraints.length > 0) {
    return {
      details: getLaneErrorDetails(constraints),
      kind: "constraint",
      wrongSkuIds: new Set(constraints.flatMap((error) => error.skuErrors)),
    }
  }

  // An event can mark a lane in error before its payload carries one, so the
  // kind comes from the location, not from `errors` being non-empty.
  if (!getLocationLaneIssue(location)) {
    return noLaneErrorSummary()
  }
  return {
    details: getLaneErrorDetails(errors),
    kind: "discrepancy",
    wrongSkuIds: new Set(),
  }
}

function noLaneErrorSummary(): LaneErrorSummary {
  return { details: [], kind: "", wrongSkuIds: new Set() }
}

/**
 * How the shelf's lane errors moved between two reads, for the manual
 * replenishment voices: a new error asking for a drink to come out (too big or
 * placed unscanned), a new discrepancy to match, or one fixed. A new error wins
 * over a fixed one; blacklisted lanes have none.
 *
 * @example getLaneErrorChange([], []) // ""
 */
export function getLaneErrorChange(
  previous: ShelfLocation[],
  next: ShelfLocation[]
): "" | "fixed" | "match" | "removeDrink" {
  const previousKeys = collectLaneErrorKeys(previous)
  const nextKeys = collectLaneErrorKeys(next)
  const added = [...nextKeys].find(([key]) => !previousKeys.has(key))
  if (added) {
    const [, error] = added
    return isConstraintError(error) || isPlacedWithoutScanningError(error)
      ? "removeDrink"
      : "match"
  }
  const fixed = [...previousKeys.keys()].some((key) => !nextKeys.has(key))
  return fixed ? "fixed" : ""
}

function collectLaneErrorKeys(
  locations: ShelfLocation[]
): Map<string, LaneError> {
  const keys = new Map<string, LaneError>()
  for (const location of locations) {
    if (isLocationBlocked(location)) {
      continue
    }
    for (const error of getLocationLaneErrors(location)) {
      const key = [
        location.id,
        error.laneErrorType,
        error.discrepancyCause,
        ...error.skuErrors,
      ].join("|")
      keys.set(key, error)
    }
  }
  return keys
}
