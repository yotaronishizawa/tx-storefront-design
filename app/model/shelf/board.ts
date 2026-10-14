import type { ShelfSpec } from "~/api/opm/schemas"

import type { ShelfLocation } from "./lane-update"
import { getLocationX } from "./location"

export type ShelfKind = "display" | "stock"
export type SelectedCell = { kind: ShelfKind; id: string } | null

export type LayoutCell = {
  id: string
  cabinet: number
  row: number
  column: number
  location: ShelfLocation | null
  isEmpty?: boolean
}

export type LayoutRow = {
  row: number
  cells: LayoutCell[]
}

export type LayoutCabinet = {
  cabinet: number
  rows: LayoutRow[]
}

type SlotPosition = {
  x: number
  y: number
  z: number
}

/** A cabinet from OPM's spec, or one inferred from lane positions when the spec has none. */
type ShelfCabinetSpec = Pick<
  ShelfSpec["cabinets"][number],
  "index" | "minPosX" | "maxPosX" | "origin"
>

type XRangeCabinetSpec = ShelfCabinetSpec & { minPosX: number; maxPosX: number }

/** Lanes whose heights differ by no more than this sit on the same row. */
const SHELF_ROW_Z_DELTA = 0.096

const STOCK_ROW_COUNT = 5
const STOCK_BOTTOM_ROW_LANE_COUNT = 11
const STOCK_DEFAULT_ROW_LANE_COUNT = 15

/** Display rows are numbered from 0 at the bottom; only rows holding a lane appear. */
export function groupDisplayShelfLocations(
  locations: ShelfLocation[],
  spec: ShelfSpec | null
): LayoutCabinet[] {
  const cabinetSpecs = spec?.cabinets.length
    ? spec.cabinets
    : inferDisplayCabinetSpecs(locations)

  const cabinets = groupByCabinet(
    locations,
    cabinetSpecs,
    getDisplayCabinetNumber
  )

  return cabinets.map(([cabinet, cabinetLocations]) => {
    const rowZValues = getShelfRowZValues(cabinetLocations)
    const locationsByRow = groupBy(cabinetLocations, (location) => {
      const position = getSlotPosition(location)
      return position ? findClosestIndex(position.z, rowZValues) : 0
    })

    const rows = [...locationsByRow.entries()]
      .sort(([left], [right]) => right - left)
      .map(([row, rowLocations]) => ({
        row,
        cells: sortByXDescending(rowLocations).map((location, index) => ({
          id: location.id || `display-${cabinet}-${row}-${index + 1}`,
          cabinet,
          row,
          column: index + 1,
          location,
        })),
      }))

    return { cabinet, rows }
  })
}

/**
 * Standard stock cabinets have at least `STOCK_ROW_COUNT` rows from 1 at the
 * bottom. Additional real lanes and rows are never truncated by the standard dimensions.
 */
export function groupStockShelfLocations(
  locations: ShelfLocation[],
  spec: ShelfSpec | null
): LayoutCabinet[] {
  const cabinetSpecs = spec?.cabinets.length
    ? spec.cabinets
    : inferStockCabinetSpecs(locations)

  const cabinets = groupByCabinet(
    locations,
    cabinetSpecs,
    getStockCabinetNumber
  )

  return cabinets.map(([cabinet, cabinetLocations]) => {
    const rowZValues = getShelfRowZValues(cabinetLocations)
    const locationsByRow = groupBy(cabinetLocations, (location) => {
      const position = getSlotPosition(location)
      return position ? findClosestIndex(position.z, rowZValues) + 1 : 1
    })

    const rows: LayoutRow[] = []
    for (
      let row = Math.max(STOCK_ROW_COUNT, rowZValues.length);
      row >= 1;
      row -= 1
    ) {
      const rowLocations = sortByXDescending(locationsByRow.get(row) ?? [])
      const cells = Array.from(
        { length: Math.max(getStockLaneCount(row), rowLocations.length) },
        (_, index) => {
          const column = index + 1
          const location = rowLocations[index] ?? null
          return {
            id: getStockCellId(location, cabinet, row, column),
            cabinet,
            row,
            column,
            location,
            isEmpty: location === null,
          }
        }
      )
      rows.push({ row, cells })
    }

    return { cabinet, rows }
  })
}

function getStockCellId(
  location: ShelfLocation | null,
  cabinet: number,
  row: number,
  column: number
): string {
  if (!location) {
    return `stock-empty-${cabinet}-${row}-${column}`
  }
  return location.id || `stock-${cabinet}-${row}-${column}`
}

function getStockLaneCount(row: number): number {
  return row === 1 ? STOCK_BOTTOM_ROW_LANE_COUNT : STOCK_DEFAULT_ROW_LANE_COUNT
}

/** One stock cabinet per distinct lane depth (`y`). */
function inferStockCabinetSpecs(
  locations: ShelfLocation[]
): ShelfCabinetSpec[] {
  const yValues = new Set<number>()
  for (const location of locations) {
    const y = getSlotPosition(location)?.y
    if (y !== undefined) {
      yValues.add(y)
    }
  }

  if (yValues.size === 0) {
    return [{ index: 1 }]
  }
  return [...yValues]
    .sort((left, right) => left - right)
    .map((y, index) => ({ index: index + 1, origin: { y } }))
}

/** A single display cabinet spanning every lane. */
function inferDisplayCabinetSpecs(
  locations: ShelfLocation[]
): ShelfCabinetSpec[] {
  const xValues = locations
    .map((location) => getSlotPosition(location)?.x)
    .filter((x): x is number => x !== undefined)

  if (xValues.length === 0) {
    return [{ index: 1 }]
  }
  return [
    {
      index: 1,
      minPosX: Math.min(...xValues) - 1,
      maxPosX: Math.max(...xValues) + 1,
    },
  ]
}

function getDisplayCabinetNumber(
  position: SlotPosition,
  cabinetSpecs: ShelfCabinetSpec[]
): number {
  const byX = cabinetSpecs.find(
    (cabinet) =>
      hasXRange(cabinet) &&
      position.x > cabinet.minPosX &&
      position.x < cabinet.maxPosX
  )
  return byX?.index ?? cabinetSpecs[0]?.index ?? 1
}

/** The cabinet whose x range holds the lane, else the one nearest in depth. */
function getStockCabinetNumber(
  position: SlotPosition,
  cabinetSpecs: ShelfCabinetSpec[]
): number {
  const byX = cabinetSpecs.find(
    (cabinet) =>
      hasXRange(cabinet) &&
      position.x >= cabinet.minPosX &&
      position.x <= cabinet.maxPosX
  )
  if (byX) {
    return byX.index
  }

  let nearest: { index: number; distance: number } | null = null
  for (const cabinet of cabinetSpecs) {
    const originY = cabinet.origin?.y
    if (originY === undefined) {
      continue
    }
    const distance = Math.abs(position.y - originY)
    if (!nearest || distance < nearest.distance) {
      nearest = { index: cabinet.index, distance }
    }
  }

  return nearest?.index ?? cabinetSpecs[0]?.index ?? 1
}

function hasXRange(cabinet: ShelfCabinetSpec): cabinet is XRangeCabinetSpec {
  return cabinet.minPosX !== undefined && cabinet.maxPosX !== undefined
}

/** The distinct row heights in a cabinet, lowest first. */
function getShelfRowZValues(locations: ShelfLocation[]): number[] {
  const zValues = locations
    .map((location) => getSlotPosition(location)?.z)
    .filter((z): z is number => z !== undefined)
    .sort((left, right) => left - right)

  const rows: number[] = []
  for (const z of zValues) {
    const previous = rows.at(-1)
    if (previous === undefined || z - previous > SHELF_ROW_Z_DELTA) {
      rows.push(z)
    }
  }
  return rows
}

/** Index of the value nearest to `target`, the first on a tie; 0 for an empty list. */
function findClosestIndex(target: number, values: number[]): number {
  let closest = 0
  for (let index = 1; index < values.length; index += 1) {
    if (Math.abs(target - values[index]) < Math.abs(target - values[closest])) {
      closest = index
    }
  }
  return closest
}

/**
 * The lanes of every cabinet in the spec plus any a lane was placed in,
 * ascending. A lane with no known position goes to cabinet 1.
 */
function groupByCabinet(
  locations: ShelfLocation[],
  cabinetSpecs: ShelfCabinetSpec[],
  getCabinetNumber: (
    position: SlotPosition,
    cabinetSpecs: ShelfCabinetSpec[]
  ) => number
): [cabinet: number, locations: ShelfLocation[]][] {
  const locationsByCabinet = groupBy(locations, (location) => {
    const position = getSlotPosition(location)
    return position ? getCabinetNumber(position, cabinetSpecs) : 1
  })
  const numbers = new Set(cabinetSpecs.map((cabinet) => cabinet.index))
  for (const cabinet of locationsByCabinet.keys()) {
    numbers.add(cabinet)
  }
  return [...numbers]
    .sort((left, right) => left - right)
    .map((cabinet) => [cabinet, locationsByCabinet.get(cabinet) ?? []])
}

/** Column 1 is the lane with the highest x. */
function sortByXDescending(locations: ShelfLocation[]): ShelfLocation[] {
  return [...locations].sort(
    (left, right) =>
      (getSlotPosition(right)?.x ?? 0) - (getSlotPosition(left)?.x ?? 0)
  )
}

function groupBy(
  locations: ShelfLocation[],
  getKey: (location: ShelfLocation) => number
): Map<number, ShelfLocation[]> {
  const groups = new Map<number, ShelfLocation[]>()
  for (const location of locations) {
    const key = getKey(location)
    const group = groups.get(key)
    if (group) {
      group.push(location)
    } else {
      groups.set(key, [location])
    }
  }
  return groups
}

/** A lane's position, or `null` unless all three coordinates are known. */
function getSlotPosition(location: ShelfLocation): SlotPosition | null {
  const x = getLocationX(location)
  const y = location.slot?.posY
  const z = location.slot?.posZ ?? location.slot?.z
  if (x === undefined || y === undefined || z === undefined) {
    return null
  }
  return { x, y, z }
}
