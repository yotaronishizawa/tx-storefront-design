import { Fragment } from "react"

import type { Sku } from "~/api/opm/schemas"
import { ProductThumb } from "~/components/product/product-thumb"
import {
  getCellDisplaySkuIds,
  isLocationUnused,
  type LayoutCabinet,
  type LayoutCell,
} from "~/model/shelf"
import { cn } from "~/utils/cn"

import { usePulsePhase } from "./use-pulse-phase"

/**
 * One stock cabinet's front for the restock study, at the real cabinet's
 * 608 × 898 proportions (the parent sets the size) with only what the real
 * shelf shows: drinks and gaps, no lane numbers or volumes. The lane to fill
 * leads, then its row; the other rows fade. `small` is the before-entry
 * list's thumbnail: no drinks, no motion. `fix` shows a red lane to put right
 * in the same way, in red, and the other red lanes dashed, as the next lanes
 * to fill are: still to do, not now.
 */
export function GuideShelfFront({
  cabinet,
  fix = false,
  flash,
  nextCellIds = [],
  otherFixCellIds = [],
  skuById,
  small = false,
  targetCellId,
  targetRow,
}: {
  cabinet: LayoutCabinet
  /** The target is a red lane to put right, not a lane to fill. */
  fix?: boolean
  /** The lane a drink just went in; a new `key` flashes it again. */
  flash?: { cellId: string; key: string }
  nextCellIds?: string[]
  /** While fixing: the red lanes after this one. */
  otherFixCellIds?: string[]
  skuById: Map<string, Sku>
  small?: boolean
  targetCellId?: string
  targetRow?: number
}) {
  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-lg bg-subtle",
        small
          ? "gap-0.5 border-2 border-strong p-0.5"
          : "overflow-hidden border-4 border-strong"
      )}
    >
      {cabinet.rows.map((row, index) => (
        <Fragment key={row.row}>
          {/* The shelf boards, drawn as the frame is, so each row reads as
              its own shelf from across the walk-in. */}
          {!small && index > 0 && (
            <div aria-hidden className="shrink-0 border-t-4 border-strong" />
          )}
          <div
            className={cn(
              "flex min-h-0 flex-1",
              small ? "gap-px rounded-md p-px" : "gap-1 p-2",
              row.row === targetRow
                ? small
                  ? "bg-success-subtle"
                  : // a step darker than the app grey, to stand out from across the walk-in
                    "bg-[#c4c4c4]"
                : "opacity-25"
            )}
          >
            {groupZoomLanes(row.cells, small ? undefined : targetCellId).map(
              (part) => {
                const lanes = part.cells.map((cell) => (
                  <GuideLane
                    key={cell.id}
                    cell={cell}
                    fix={fix}
                    flashKey={cell.id === flash?.cellId ? flash.key : ""}
                    role={
                      cell.id === targetCellId
                        ? "target"
                        : nextCellIds.includes(cell.id) ||
                            otherFixCellIds.includes(cell.id)
                          ? "next"
                          : undefined
                    }
                    skuById={skuById}
                    small={small}
                    zoomed={part.zoom}
                  />
                ))
                // The lanes the zoom beside the shelf shows, framed and tinted as
                // it is, from shelf board to shelf board.
                return part.zoom ? (
                  <div
                    key="zoom"
                    data-zoom-source
                    className={cn(
                      "-my-2 flex min-w-0 gap-1 px-1 py-2 outline-4 -outline-offset-4 outline-(--border-color-strong) outline-dashed",
                      fix ? "bg-error-subtle" : "bg-success-subtle"
                    )}
                    style={{ flex: part.cells.length }}
                  >
                    {lanes}
                  </div>
                ) : (
                  lanes
                )
              }
            )}
          </div>
        </Fragment>
      ))}
    </div>
  )
}

/**
 * A row's lanes left to right, with the target and the lane either side of it
 * in one part of their own.
 */
function groupZoomLanes(
  cells: LayoutCell[],
  targetCellId?: string
): { cells: LayoutCell[]; zoom: boolean }[] {
  const sorted = [...cells].sort((left, right) => left.column - right.column)
  const index = sorted.findIndex((cell) => cell.id === targetCellId)
  if (index < 0) {
    return [{ cells: sorted, zoom: false }]
  }
  const start = Math.max(0, index - 1)
  return [
    { cells: sorted.slice(0, start), zoom: false },
    { cells: sorted.slice(start, index + 2), zoom: true },
    { cells: sorted.slice(index + 2), zoom: false },
  ]
}

function GuideLane({
  cell,
  fix,
  flashKey,
  role,
  skuById,
  small,
  zoomed = false,
}: {
  cell: LayoutCell
  fix: boolean
  flashKey: string
  role?: "next" | "target"
  skuById: Map<string, Sku>
  small: boolean
  /** One of the lanes the zoom shows: tinted as the zoom is. */
  zoomed?: boolean
}) {
  const unused = Boolean(cell.location && isLocationUnused(cell.location))
  const skuId = getCellDisplaySkuIds(cell, skuById)[0] ?? ""
  const pulseRef = usePulsePhase(
    role === "target" && !small ? cell.id : undefined
  )
  return (
    <div
      ref={pulseRef}
      className={cn(
        "relative flex min-w-0 flex-1 items-end justify-center rounded-sm border-transparent",
        // Drinks stand on the row itself, as on the real shelf, and an empty
        // lane is just more of the row.
        small ? "border bg-default" : "border-2",
        zoomed && (fix ? "bg-error-subtle" : "bg-success-subtle"),
        unused && "bg-muted",
        role === "next" &&
          (fix ? "border-dashed border-error" : "border-dashed border-success"),
        role === "target" &&
          (small
            ? "border-success bg-success"
            : fix
              ? "animate-pulse border-error bg-error/40"
              : "animate-pulse bg-success/40")
      )}
    >
      {flashKey && (
        <span
          key={flashKey}
          aria-hidden
          className="lane-flash pointer-events-none absolute -inset-1 z-10 rounded-sm bg-success/45 opacity-0 ring-4 ring-success"
        />
      )}
      {skuId && !unused && !small && (
        <ProductThumb
          className="h-[85%] w-full object-cover mix-blend-multiply"
          sku={skuById.get(skuId)}
        />
      )}
    </div>
  )
}
