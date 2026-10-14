import {
  getLocationLaneIssue,
  getRestockingPlacementCellState,
  isLocationUnused,
  type LayoutCell,
  type RestockingPlacementState,
} from "~/model/shelf"

/** The one background a lane gets; `getLaneTone` picks it. */
export type LaneTone =
  | "canPlace"
  | "cannotPlace"
  | "empty"
  | "error"
  | "idle"
  | "unused"
  | "warning"

export type LaneBadgeKind = "error" | "warning"

/**
 * Legend entries name lane colours, not causes: aged and misplaced both paint
 * the lane yellow, so they share the one `warning` entry.
 */
export type LaneLegendKey =
  | "added"
  | "cannotPlace"
  | "canPlace"
  | "error"
  | "lastAdded"
  | "unused"
  | "warning"

/**
 * The single owner of lane-state precedence: the lane renders this tone and the
 * legend names it, so the two cannot drift.
 */
export function getLaneTone(
  cell: LayoutCell,
  {
    aged,
    misplaced,
    restockingPlacement,
  }: {
    aged: boolean
    misplaced: boolean
    restockingPlacement?: RestockingPlacementState
  }
): LaneTone {
  if (cell.location && isLocationUnused(cell.location)) {
    return "unused"
  }
  // An error wins over placement: it is usually the drink just placed.
  if (getLocationIssue(cell.location)) {
    return "error"
  }
  const placement = getRestockingPlacementCellState(cell, restockingPlacement)
  if (placement === "can-place") {
    return "canPlace"
  }
  if (placement === "cannot-place") {
    return "cannotPlace"
  }
  if (aged || misplaced) {
    return "warning"
  }
  return cell.isEmpty ? "empty" : "idle"
}

/**
 * The lane's corner badge. It ignores placement, so an error or warning stays
 * visible while a scanned drink paints the board.
 */
export function getLaneBadge(
  cell: LayoutCell,
  { aged, misplaced }: { aged: boolean; misplaced: boolean }
): LaneBadgeKind | null {
  if (cell.location && isLocationUnused(cell.location)) {
    return null
  }
  if (getLocationIssue(cell.location)) {
    return "error"
  }
  if (aged || misplaced) {
    return "warning"
  }
  return null
}

/** The tones worth a legend entry; the two plain ones need no explaining. */
const TONE_LEGEND_KEYS = {
  canPlace: "canPlace",
  cannotPlace: "cannotPlace",
  empty: null,
  error: "error",
  idle: null,
  unused: "unused",
  warning: "warning",
} as const satisfies Record<LaneTone, LaneLegendKey | null>

/** Which legend entries the cabinet on screen needs. */
export function getPresentLaneStates(
  cells: LayoutCell[],
  {
    addedCounts,
    agedLaneIds,
    lastAddedLaneId,
    misplacedLaneIds,
    restockingPlacement,
  }: {
    addedCounts?: ReadonlyMap<string, number>
    agedLaneIds: ReadonlySet<string>
    lastAddedLaneId?: string
    misplacedLaneIds?: ReadonlySet<string>
    restockingPlacement?: RestockingPlacementState
  }
): Set<LaneLegendKey> {
  const present = new Set<LaneLegendKey>()
  for (const cell of cells) {
    if (!cell.location) {
      continue
    }
    const aged = agedLaneIds.has(cell.id)
    const misplaced = misplacedLaneIds?.has(cell.id) ?? false
    const tone = getLaneTone(cell, { aged, misplaced, restockingPlacement })

    const legendKey = TONE_LEGEND_KEYS[tone]
    if (legendKey) {
      present.add(legendKey)
    }
    const badge = getLaneBadge(cell, { aged, misplaced })
    if (badge) {
      present.add(badge)
    }
    // Mirrors the lane, which hides these markers on an unused lane.
    if (tone === "unused") {
      continue
    }
    if ((addedCounts?.get(cell.id) ?? 0) > 0) {
      present.add("added")
    }
    if (cell.id === lastAddedLaneId) {
      present.add("lastAdded")
    }
  }
  return present
}

function getLocationIssue(location: LayoutCell["location"]) {
  return location ? getLocationLaneIssue(location) : ""
}
