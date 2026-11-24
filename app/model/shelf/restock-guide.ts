import type { LayoutCabinet, LayoutCell } from "./board"
import {
  getLocationLaneErrors,
  getStockLocationSkuIds,
  isLocationUnused,
} from "./location"

/**
 * The restock study's lane guidance: for the scanned drink, the lanes to fill
 * in order, chosen so the drink lands where it is easy to find and mixes with
 * nothing. A lane of the same drink first, then empty lanes beside it; with
 * none, an empty lane next to a drink to find it by. Lanes that already hold
 * another drink are never suggested.
 */

/** Where a lane sits, and what to find it by. */
export type GuideLandmark =
  | { kind: "same-lane" }
  /** `distance` lanes to the `side` of the nearest drink: 1 is just beside it. */
  | { kind: "beside"; distance: number; side: "left" | "right"; skuId: string }
  | { kind: "edge"; side: "left" | "right" }
  | { kind: "from-left"; count: number }
  | { kind: "from-right"; count: number }

export type GuideLane = {
  cell: LayoutCell
  /** Drinks it still takes. */
  room: number
}

type Candidate = GuideLane & { same: boolean }

/** Penalty by row, 1 at the bottom: the chest and waist rows come first. */
const ROW_PENALTY: Record<number, number> = { 4: 0, 3: 1, 5: 2, 2: 3, 1: 4 }

/**
 * The lanes to fill, in order, for `neededCount` drinks. Empty when nothing
 * on the shelf takes the drink without mixing it.
 */
export function planGuideLanes({
  cabinets,
  capacity,
  neededCount,
  skuId,
  unstockableLaneIds,
}: {
  cabinets: LayoutCabinet[]
  capacity: number
  neededCount: number
  skuId: string
  unstockableLaneIds: ReadonlySet<string>
}): string[] {
  const rows = cabinets.flatMap((cabinet) =>
    cabinet.rows.map((row) =>
      [...row.cells].sort((left, right) => left.column - right.column)
    )
  )
  const wanted = Math.max(1, neededCount)

  const runs = rows.flatMap((cells) => {
    const row = cells.map((cell) =>
      readCandidate(cell, skuId, capacity, unstockableLaneIds)
    )
    return row.flatMap((seed, index) => {
      if (!seed) {
        return []
      }
      const run = growRun(row, index, wanted)
      const room = run.reduce((total, lane) => total + lane.room, 0)
      // A drink beside an empty lane is what staff find it by.
      const findable =
        seed.same ||
        Boolean(frontSkuId(cells[index - 1]) || frontSkuId(cells[index + 1]))
      return [
        {
          laneIds: run.map((lane) => lane.cell.location?.id ?? ""),
          score:
            (seed.same ? 0 : 100) +
            (room >= wanted ? 0 : 50) +
            (findable ? 0 : 20) +
            (ROW_PENALTY[seed.cell.row] ?? 5) * 5 +
            run.length,
        },
      ]
    })
  })

  runs.sort((left, right) => left.score - right.score)
  return runs[0]?.laneIds ?? []
}

/** The first lane of the plan that still takes a drink. */
export function findGuideTarget(
  cabinets: LayoutCabinet[],
  laneIds: string[],
  capacity: number
): GuideLane | undefined {
  for (const laneId of laneIds) {
    const cell = findCellByLocationId(cabinets, laneId)
    if (!cell?.location || isLocationUnused(cell.location)) {
      continue
    }
    const room = capacity - getStockLocationSkuIds(cell.location).length
    if (room > 0) {
      return { cell, room }
    }
  }
  return undefined
}

/** How to find a lane: its own drink, a drink beside it, or a shelf edge. */
export function describeGuideLane(
  cabinets: LayoutCabinet[],
  cell: LayoutCell,
  skuId: string
): GuideLandmark {
  const skuIds = cell.location ? getStockLocationSkuIds(cell.location) : []
  if (skuIds.length > 0 && skuIds.every((id) => id === skuId)) {
    return { kind: "same-lane" }
  }

  const row = findRowCells(cabinets, cell)
  const index = row.findIndex((item) => item.id === cell.id)
  // The nearest drink in the row; on a tie, the one on the left, read first.
  for (let distance = 1; distance < row.length; distance += 1) {
    const left = frontSkuId(row[index - distance])
    if (left) {
      return { kind: "beside", distance, side: "right", skuId: left }
    }
    const right = frontSkuId(row[index + distance])
    if (right) {
      return { kind: "beside", distance, side: "left", skuId: right }
    }
  }
  if (index === 0) {
    return { kind: "edge", side: "left" }
  }
  if (index === row.length - 1) {
    return { kind: "edge", side: "right" }
  }
  const fromRight = row.length - index
  return index + 1 <= fromRight
    ? { kind: "from-left", count: index + 1 }
    : { kind: "from-right", count: fromRight }
}

/**
 * Where a cabinet stands among the walk-in's, as staff face them: cabinets
 * come left to right. Empty when there is only one.
 */
export function getShelfPosition(
  cabinets: LayoutCabinet[],
  cabinet: number
): "center" | "left" | "right" | "" {
  const index = cabinets.findIndex((item) => item.cabinet === cabinet)
  if (cabinets.length < 2 || index < 0) {
    return ""
  }
  if (index === 0) {
    return "left"
  }
  return index === cabinets.length - 1 ? "right" : "center"
}

/** `"right"` or `"left"` when `next` is the lane just beside `previous`. */
export function getNeighbourSide(
  previous: LayoutCell,
  next: LayoutCell
): "left" | "right" | "" {
  if (previous.cabinet !== next.cabinet || previous.row !== next.row) {
    return ""
  }
  if (next.column === previous.column + 1) {
    return "right"
  }
  if (next.column === previous.column - 1) {
    return "left"
  }
  return ""
}

/**
 * The lanes either side of a cell in its row, as staff face them; a side is
 * undefined past the cabinet's edge.
 */
export function getRowNeighbours(
  cabinet: LayoutCabinet,
  cellId: string
): { left?: LayoutCell; right?: LayoutCell } {
  for (const row of cabinet.rows) {
    const cell = row.cells.find((item) => item.id === cellId)
    if (cell) {
      return {
        left: row.cells.find((item) => item.column === cell.column - 1),
        right: row.cells.find((item) => item.column === cell.column + 1),
      }
    }
  }
  return {}
}

export function findCellByLocationId(
  cabinets: LayoutCabinet[],
  locationId: string
): LayoutCell | undefined {
  for (const cabinet of cabinets) {
    for (const row of cabinet.rows) {
      const cell = row.cells.find((item) => item.location?.id === locationId)
      if (cell) {
        return cell
      }
    }
  }
  return undefined
}

function readCandidate(
  cell: LayoutCell,
  skuId: string,
  capacity: number,
  unstockableLaneIds: ReadonlySet<string>
): Candidate | null {
  const { location } = cell
  if (
    !location ||
    isLocationUnused(location) ||
    unstockableLaneIds.has(location.id) ||
    getLocationLaneErrors(location).length > 0
  ) {
    return null
  }
  const skuIds = getStockLocationSkuIds(location)
  const same = skuIds.length > 0 && skuIds.every((id) => id === skuId)
  const room = capacity - skuIds.length
  if (room <= 0 || (skuIds.length > 0 && !same)) {
    return null
  }
  return { cell, room, same }
}

/**
 * The seed lane, then empty lanes beside it, nearest first and right before
 * left, until they take `wanted` drinks.
 */
function growRun(
  row: (Candidate | null)[],
  seedIndex: number,
  wanted: number
): Candidate[] {
  const seed = row[seedIndex]
  if (!seed) {
    return []
  }
  const run = [seed]
  let room = seed.room
  let right = seedIndex + 1
  let left = seedIndex - 1
  while (room < wanted) {
    const next = isOpenEmpty(row[right])
      ? row[right++]
      : isOpenEmpty(row[left])
        ? row[left--]
        : null
    if (!next) {
      break
    }
    run.push(next)
    room += next.room
  }
  return run
}

function isOpenEmpty(candidate: Candidate | null | undefined): boolean {
  return Boolean(candidate && !candidate.same)
}

function findRowCells(
  cabinets: LayoutCabinet[],
  cell: LayoutCell
): LayoutCell[] {
  const cabinet = cabinets.find((item) => item.cabinet === cell.cabinet)
  const row = cabinet?.rows.find((item) => item.row === cell.row)
  return row ? [...row.cells].sort((a, b) => a.column - b.column) : []
}

function frontSkuId(cell: LayoutCell | undefined): string {
  return cell?.location ? (getStockLocationSkuIds(cell.location)[0] ?? "") : ""
}

/** What the restocking board draws for the study's guide. */
export type RestockGuideView = {
  skuId: string
  /** New on every scan, of the same drink too: a scan reopens a guide staff left for the list. */
  scanKey: string
  /** The list asks for no more of this drink: back to the list for the next case. */
  done: boolean
  /** Missing when no lane takes the drink without mixing it. */
  target?: {
    cabinet: number
    cellId: string
    landmark: GuideLandmark
    /**
     * How many more to bring, out of how many: the list's count for a drink on
     * it, else the lane's room out of what it holds.
     */
    remaining: { count: number; total: number }
    room: number
    row: number
    shelf: "center" | "left" | "right" | ""
  }
  /** The planned lanes after the target, in order. */
  nextCellIds: string[]
}

/** One drink on the restock study's before-entry list. */
export type RestockEntryItemView = {
  skuId: string
  /** How many more the list asks for. Shown, but staff need not count. */
  neededCount: number
  /** Drinks left on the display shelf over what its facings hold; null off display. */
  displayRatio: number | null
  /** Urgent: the display shelf is running low. */
  urgent: boolean
  /** Where it goes first; missing when no lane takes it without mixing. */
  target?: {
    cellId: string
    landmark: GuideLandmark
    row: number
    shelf: "center" | "left" | "right" | ""
  }
}
