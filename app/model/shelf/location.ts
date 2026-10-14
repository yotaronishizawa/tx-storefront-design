import {
  readOpmLocationErrors,
  UnusedType,
  type SkuEntry,
} from "~/api/opm/schemas"
import { enumNameOf, isNoneEnum } from "~/api/shared"

import {
  fromOpmLocationError,
  type LaneError,
  type ShelfLocation,
} from "./lane-update"

export function getLocationSkuId(location: ShelfLocation): string {
  return location.skuIds?.[0] || location.skuId || ""
}

/**
 * Every SKU in a lane, newest first. Without `skuIds`, the single `skuId`
 * still counts as one drink.
 *
 * @example getStockLocationSkuIds({ skuId: "a" } as ShelfLocation) // ["a"]
 */
export function getStockLocationSkuIds(location: ShelfLocation): string[] {
  return location.skuIds ?? [getLocationSkuId(location)].filter(Boolean)
}

/**
 * One entry per drink in `skuIds`, same order.
 *
 * @example getStockLocationSkuEntries({ skuIds: ["a"] } as ShelfLocation) // [{ skuId: "a" }]
 */
export function getStockLocationSkuEntries(
  location: ShelfLocation
): SkuEntry[] {
  return alignSkuEntriesByPosition(
    getStockLocationSkuIds(location),
    location.skuEntries ?? []
  )
}

/**
 * OPM's entries matched to `skuIds` by position. A list of the wrong length
 * gives every drink an unknown date, so dwell time is never guessed.
 *
 * @example alignSkuEntriesByPosition(["a", "b"], [{ skuId: "a", addedAt: "2026-09-24T10:00:00Z" }]) // [{ skuId: "a" }, { skuId: "b" }]
 */
export function alignSkuEntriesByPosition(
  skuIds: string[],
  entries: SkuEntry[]
): SkuEntry[] {
  if (entries.length !== skuIds.length) {
    return skuIds.map((skuId) => ({ skuId }))
  }
  return skuIds.map((skuId, index) =>
    entries[index].skuId === skuId
      ? entries[index]
      : { ...entries[index], skuId }
  )
}

/**
 * Matches entries to `skuIds` by SKU, as OPM stores them: each drink keeps its
 * date; a drink with no entry yet gets `newDrinkAddedAt`, or none.
 *
 * @example alignSkuEntries(["b", "a"], [{ skuId: "a", addedAt: "2026-09-24T10:00:00Z" }]) // [{ skuId: "b" }, { skuId: "a", addedAt: "2026-09-24T10:00:00Z" }]
 * @example alignSkuEntries(["b"], [], "2026-10-02T09:00:00Z") // [{ skuId: "b", addedAt: "2026-10-02T09:00:00Z" }]
 */
export function alignSkuEntries(
  skuIds: string[],
  entries: SkuEntry[],
  newDrinkAddedAt?: string
): SkuEntry[] {
  if (
    entries.length === skuIds.length &&
    entries.every((entry, index) => entry.skuId === skuIds[index])
  ) {
    return entries
  }

  const bySku = new Map<string, SkuEntry[]>()
  for (const entry of entries) {
    const stack = bySku.get(entry.skuId) ?? []
    stack.push(entry)
    bySku.set(entry.skuId, stack)
  }

  const aligned: SkuEntry[] = new Array<SkuEntry>(skuIds.length)
  for (let index = skuIds.length - 1; index >= 0; index -= 1) {
    const skuId = skuIds[index]
    aligned[index] =
      bySku.get(skuId)?.pop() ?? newSkuEntry(skuId, newDrinkAddedAt)
  }
  return aligned
}

function newSkuEntry(skuId: string, addedAt: string | undefined): SkuEntry {
  return addedAt ? { skuId, addedAt } : { skuId }
}

/** A lane's position along the shelf. OPM names it `posX` on some payloads and `x` on others. */
export function getLocationX(location: ShelfLocation): number | undefined {
  return location.slot?.posX ?? location.slot?.x
}

export function isLocationBlocked(location: ShelfLocation): boolean {
  return Boolean(location.isBlackList)
}

/** Switched off with its whole cabinet by the layout editor. */
export function isLocationCabinetDisabled(location: ShelfLocation): boolean {
  const { unusedType } = location
  return (
    isLocationBlocked(location) &&
    unusedType !== undefined &&
    enumNameOf(UnusedType, unusedType) === "CabinetDisabled"
  )
}

export function isLocationUnused(location: ShelfLocation): boolean {
  return isLocationBlocked(location) || !isNoneEnum(location.unusedType)
}

export function getLocationLaneErrors(location: ShelfLocation): LaneError[] {
  return location.laneErrors ?? readLegacyOpmLaneErrors(location)
}

/** Keyed on the `errors` array, so each payload is decoded once, not on every render. */
const opmLaneErrorsCache = new WeakMap<object, LaneError[]>()

/** A lane that has had no lane update yet: its errors from the OPM payload. */
function readLegacyOpmLaneErrors({ errors }: ShelfLocation): LaneError[] {
  if (!errors) {
    return []
  }
  let laneErrors = opmLaneErrorsCache.get(errors)
  if (!laneErrors) {
    laneErrors = readOpmLocationErrors(errors).map(fromOpmLocationError)
    opmLaneErrorsCache.set(errors, laneErrors)
  }
  return laneErrors
}

/**
 * A label for a red lane, or `""`. Only an actual error counts: the hub sends
 * an `Error` event with none for a change it cannot name, and that lane is clear.
 */
export function getLocationLaneIssue(location: ShelfLocation): string {
  const errors = getLocationLaneErrors(location)
  if (errors.length === 0) {
    return ""
  }

  const labels = errors.map((error) => error.laneErrorType).filter(Boolean)
  return labels.length > 0 ? labels.join(", ") : "LaneError"
}
