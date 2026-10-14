import { UnusedType, type ShelfSpec, type Sku } from "~/api/opm/schemas"
import { getSkuJanCode } from "~/model/sku"
import { createId } from "~/utils/id"

import {
  groupDisplayShelfLocations,
  type LayoutCabinet,
  type LayoutCell,
  type LayoutRow,
} from "./board"
import { getBoardCells } from "./cells"
import { setLocationSkuId } from "./editing"
import type { ShelfLocation } from "./lane-update"
import { getCellSkuId } from "./layout-cells"
import {
  getLocationSkuId,
  getLocationX,
  isLocationBlocked,
  isLocationCabinetDisabled,
} from "./location"

/** An insert goes before `beforeLocationId`, or at the row's end when `null`. */
export type ProductOperation =
  | {
      selectedIds: string[]
      skuId: string
      type: "replace"
    }
  | {
      beforeLocationId: string | null
      cabinet: number
      neighborLocationId: string
      row: number
      skuId: string
      type: "insert"
    }

/** What `isCellChanged` compares a lane against. */
type OriginalLaneState = { blocked: boolean; skuId: string }

/** Spacing given to a row whose lanes all share one x. */
const COLLAPSED_ROW_STEP = 0.05

/** Keeps the last lane off the cabinet's edge. */
const CABINET_EDGE_MARGIN = 0.02

/**
 * Applies a product operation. With `replaceAllOfSkuId`, every lane holding a
 * drink with that SKU's JAN code gets the new product too. Returns the lanes to
 * keep selected: the replaced ones, or the newly inserted one.
 */
export function applyProductOperation(
  locations: ShelfLocation[],
  board: LayoutCabinet[],
  spec: ShelfSpec | null,
  operation: ProductOperation,
  skuById: Map<string, Sku>,
  replaceAllOfSkuId: string | null
): { locations: ShelfLocation[]; selectedIds: string[] } {
  let next: ShelfLocation[]
  let selectedIds: string[]
  if (operation.type === "replace") {
    next = replaceSelectedLocations(
      locations,
      operation.selectedIds,
      operation.skuId
    )
    selectedIds = operation.selectedIds
  } else {
    next = insertLocationInRow(locations, board, spec, operation)
    selectedIds = [next.at(-1)?.id ?? ""]
  }

  if (replaceAllOfSkuId) {
    next = replaceSameJanLocations(
      next,
      replaceAllOfSkuId,
      operation.skuId,
      skuById
    )
  }

  return { locations: next, selectedIds }
}

/**
 * True when the new product is taller than every drink it replaces, or than
 * the drink it sits next to, so may not fit under the shelf above.
 */
export function isTallerProduct(
  locations: ShelfLocation[],
  operation: ProductOperation,
  skuById: Map<string, Sku>
): boolean {
  const nextHeight = skuById.get(operation.skuId)?.z ?? 0
  if (nextHeight <= 0) {
    return false
  }

  const comparedIds =
    operation.type === "replace"
      ? operation.selectedIds
      : [operation.neighborLocationId]

  const currentHeights = comparedIds.map((locationId) => {
    const location = locations.find((item) => item.id === locationId)
    const skuId = location ? getLocationSkuId(location) : ""
    return skuById.get(skuId)?.z ?? 0
  })
  const tallestCurrent = Math.max(0, ...currentHeights)
  return tallestCurrent > 0 && nextHeight > tallestCurrent
}

/**
 * Another SKU already on the shelf with the same JAN code as `newSkuId` — the
 * same drink under a different id — or "" when there is none.
 */
export function findSameJanSkuId(
  locations: ShelfLocation[],
  newSkuId: string,
  skuById: Map<string, Sku>
): string {
  const nextCode = getSkuJanCode(skuById.get(newSkuId))
  if (!nextCode) {
    return ""
  }

  for (const location of locations) {
    const skuId = getLocationSkuId(location)
    if (
      skuId &&
      skuId !== newSkuId &&
      getSkuJanCode(skuById.get(skuId)) === nextCode
    ) {
      return skuId
    }
  }

  return ""
}

/** The rest stay put: OPM resets the stock of a lane whose position moves. */
export function removeLocations(
  locations: ShelfLocation[],
  ids: ReadonlySet<string>
): ShelfLocation[] {
  return locations.filter((location) => !ids.has(location.id))
}

/** Rows exist only through their lanes, so an emptied row would vanish and renumber the rows above. */
export function emptiesARow(
  board: LayoutCabinet[],
  ids: ReadonlySet<string>
): boolean {
  return board.some((cabinet) =>
    cabinet.rows.some(
      (row) =>
        row.cells.length > 0 && row.cells.every((cell) => ids.has(cell.id))
    )
  )
}

/** Every lane switched off with the cabinet; one blacklisted lane does not count, nor does an empty cabinet. */
export function isCabinetBlocked(cabinet: LayoutCabinet | undefined): boolean {
  if (!cabinet) {
    return false
  }
  const locations = getCabinetLocations(cabinet)
  return locations.length > 0 && locations.every(isLocationCabinetDisabled)
}

export function setCabinetBlocked(
  locations: ShelfLocation[],
  cabinet: LayoutCabinet,
  blocked: boolean
): ShelfLocation[] {
  const ids = new Set(
    getCabinetLocations(cabinet).map((location) => location.id)
  )
  return locations.map((location) =>
    ids.has(location.id) ? setLocationBlocked(location, blocked) : location
  )
}

/**
 * OPM's rule for the cabinet exclusion box: excluded cabinets form one block
 * starting at the end farthest from where the robot rests, and one cabinet
 * always stays in use. So only the next cabinet in from that block can be
 * excluded, and only the block's innermost cabinet put back in use.
 *
 * @example
 * // Non-mirrored, cabinets 1-3 in use: only 3 can be excluded.
 * canToggleCabinetBlocked(board, 3, false) // true
 * canToggleCabinetBlocked(board, 2, false) // false
 */
export function canToggleCabinetBlocked(
  board: LayoutCabinet[],
  cabinet: number,
  mirrored: boolean
): boolean {
  const fromFarEnd = [...board].sort((left, right) =>
    mirrored ? left.cabinet - right.cabinet : right.cabinet - left.cabinet
  )
  // A partly excluded cabinet counts as excluded, as in OPM.
  const firstInUse = fromFarEnd.findIndex(
    (item) => !getCabinetLocations(item).some(isLocationCabinetDisabled)
  )
  if (firstInUse === -1) {
    return fromFarEnd.at(-1)?.cabinet === cabinet
  }

  const lastExcluded = fromFarEnd[firstInUse - 1]
  if (lastExcluded?.cabinet === cabinet) {
    return true
  }
  const inUseCount = fromFarEnd.length - firstInUse
  return inUseCount > 1 && fromFarEnd[firstInUse].cabinet === cabinet
}

/** A lane with a different product or blocked state than when it was loaded; a new lane always is. */
export function isCellChanged(
  cell: LayoutCell,
  originalSkuByLocationId: Map<string, OriginalLaneState>
): boolean {
  if (!cell.location) {
    return false
  }

  const original = originalSkuByLocationId.get(cell.id)
  if (!original) {
    return true
  }

  return (
    original.skuId !== getLocationSkuId(cell.location) ||
    original.blocked !== isLocationBlocked(cell.location)
  )
}

export function buildOriginalSkuMap(
  locations: ShelfLocation[]
): Map<string, OriginalLaneState> {
  return new Map(
    locations.map((location) => [
      location.id,
      {
        blocked: isLocationBlocked(location),
        skuId: getLocationSkuId(location),
      },
    ])
  )
}

/** Compares drinks and blocked state per row; positions are ignored. */
export function hasLayoutChanges(
  base: LayoutCabinet[],
  edited: LayoutCabinet[]
): boolean {
  return boardContentSignature(base) !== boardContentSignature(edited)
}

/**
 * A row with its original lane count gets OPM's positions back; with its
 * original drinks too, its original lanes.
 */
export function alignWithBaseLayout(
  locations: ShelfLocation[],
  baseLocations: ShelfLocation[],
  spec: ShelfSpec | null
): ShelfLocation[] {
  const baseRows = new Map(
    groupDisplayShelfLocations(baseLocations, spec).flatMap((cabinet) =>
      cabinet.rows.map((row) => [rowKey(cabinet.cabinet, row.row), row])
    )
  )
  const replacements = new Map<string, ShelfLocation>()

  for (const cabinet of groupDisplayShelfLocations(locations, spec)) {
    for (const row of cabinet.rows) {
      const baseRow = baseRows.get(rowKey(cabinet.cabinet, row.row))
      if (!baseRow || baseRow.cells.length !== row.cells.length) {
        continue
      }
      const sameDrinks = rowSkuSequence(baseRow) === rowSkuSequence(row)
      row.cells.forEach((cell, index) => {
        const baseLocation = baseRow.cells[index].location
        if (!cell.location || !baseLocation) {
          return
        }
        replacements.set(
          cell.id,
          sameDrinks
            ? {
                ...baseLocation,
                isBlackList: cell.location.isBlackList,
                unusedType: cell.location.unusedType,
              }
            : { ...cell.location, slot: baseLocation.slot }
        )
      })
    }
  }

  return locations.map((location) => replacements.get(location.id) ?? location)
}

/** Compares two layouts by what a save would change, regardless of order. */
export function layoutSignature(locations: ShelfLocation[]): string {
  return JSON.stringify(
    locations
      .map((location) => ({
        blocked: isLocationBlocked(location),
        id: location.id,
        skuId: getLocationSkuId(location),
        x: getLocationX(location) ?? null,
      }))
      .sort((left, right) => left.id.localeCompare(right.id))
  )
}

function boardContentSignature(board: LayoutCabinet[]): string {
  return JSON.stringify(
    board.map((cabinet) => [
      cabinet.cabinet,
      cabinet.rows.map((row) => [
        row.row,
        row.cells.map((cell) =>
          cell.location
            ? [
                getLocationSkuId(cell.location),
                isLocationBlocked(cell.location),
              ]
            : null
        ),
      ]),
    ])
  )
}

function rowKey(cabinet: number, row: number): string {
  return `${cabinet}:${row}`
}

function rowSkuSequence(row: LayoutRow): string {
  return row.cells.map((cell) => getCellSkuId(cell, "display")).join("|")
}

function getCabinetLocations(cabinet: LayoutCabinet): ShelfLocation[] {
  return getBoardCells([cabinet]).flatMap((cell) =>
    cell.location ? [cell.location] : []
  )
}

function replaceSelectedLocations(
  locations: ShelfLocation[],
  selectedIds: string[],
  skuId: string
): ShelfLocation[] {
  const selected = new Set(selectedIds)
  return locations.map((location) =>
    selected.has(location.id) ? setLocationSkuId(location, skuId) : location
  )
}

function replaceSameJanLocations(
  locations: ShelfLocation[],
  sourceSkuId: string,
  skuId: string,
  skuById: Map<string, Sku>
): ShelfLocation[] {
  const sourceCode = getSkuJanCode(skuById.get(sourceSkuId))
  if (!sourceCode) {
    return locations
  }
  return locations.map((location) =>
    getSkuJanCode(skuById.get(getLocationSkuId(location))) === sourceCode
      ? setLocationSkuId(location, skuId)
      : location
  )
}

function insertLocationInRow(
  locations: ShelfLocation[],
  board: LayoutCabinet[],
  spec: ShelfSpec | null,
  {
    beforeLocationId,
    cabinet,
    row,
    skuId,
  }: Extract<ProductOperation, { type: "insert" }>
): ShelfLocation[] {
  const currentRow = board
    .find((item) => item.cabinet === cabinet)
    ?.rows.find((item) => item.row === row)
  const anchor =
    currentRow?.cells.find((cell) => cell.id === beforeLocationId)?.location ??
    currentRow?.cells.at(-1)?.location

  if (!currentRow || !anchor) {
    return locations
  }

  const newLocation = setLocationBlocked(
    { ...setLocationSkuId(anchor, skuId), id: createId() },
    false
  )
  const orderedIds = currentRow.cells.map((cell) => cell.id)
  const beforeIndex = orderedIds.indexOf(beforeLocationId ?? "")
  orderedIds.splice(
    beforeIndex === -1 ? orderedIds.length : beforeIndex,
    0,
    newLocation.id
  )

  const next = [...locations, newLocation]
  const range = getCabinetXRange(spec, cabinet)
  return range
    ? spreadAcrossCabinet(next, orderedIds, range)
    : rebalanceOrderedLocations(next, orderedIds)
}

function getCabinetXRange(
  spec: ShelfSpec | null,
  cabinet: number
): { maxX: number; minX: number } | null {
  const cabinetSpec = spec?.cabinets.find((item) => item.index === cabinet)
  const minX = cabinetSpec?.minPosX
  const maxX = cabinetSpec?.maxPosX
  return minX !== undefined && maxX !== undefined && maxX > minX
    ? { maxX, minX }
    : null
}

function spreadAcrossCabinet(
  locations: ShelfLocation[],
  orderedIds: string[],
  { maxX, minX }: { maxX: number; minX: number }
): ShelfLocation[] {
  const step = (maxX - minX - CABINET_EDGE_MARGIN) / orderedIds.length
  return placeLanes(
    locations,
    orderedIds.map((id, index) => [id, maxX - step * (index + 1)])
  )
}

/** Without a cabinet range: spaces the lanes across the x range they already cover. */
function rebalanceOrderedLocations(
  locations: ShelfLocation[],
  orderedIds: string[]
): ShelfLocation[] {
  if (orderedIds.length <= 1) {
    return locations
  }

  const positions: number[] = []
  for (const id of orderedIds) {
    const location = locations.find((item) => item.id === id)
    const x = location ? getLocationX(location) : undefined
    if (x !== undefined) {
      positions.push(x)
    }
  }
  if (positions.length === 0) {
    return locations
  }

  const maxX = Math.max(...positions)
  const minX = Math.min(...positions)
  const step =
    maxX === minX ? COLLAPSED_ROW_STEP : (maxX - minX) / (orderedIds.length - 1)
  return placeLanes(
    locations,
    orderedIds.map((id, index) => [id, maxX - step * index])
  )
}

function placeLanes(
  locations: ShelfLocation[],
  positions: [id: string, x: number][]
): ShelfLocation[] {
  const xById = new Map(positions)
  return locations.map((location) => {
    const x = xById.get(location.id)
    return x === undefined ? location : setLocationX(location, x)
  })
}

function setLocationBlocked(
  location: ShelfLocation,
  blocked: boolean
): ShelfLocation {
  return {
    ...location,
    isBlackList: blocked,
    unusedType: blocked ? UnusedType.CabinetDisabled : UnusedType.None,
  }
}

/** Writes `posX`, and `x` too when the slot already uses that name. */
function setLocationX(location: ShelfLocation, x: number): ShelfLocation {
  const slot = { ...location.slot, posX: x }
  if (location.slot?.x !== undefined) {
    slot.x = x
  }
  return { ...location, slot }
}
