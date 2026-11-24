import { useTranslation } from "react-i18next"

import type { Sku } from "~/api/opm/schemas"
import { ProductThumb } from "~/components/product/product-thumb"
import {
  getCellDisplaySkuIds,
  getRowNeighbours,
  isLocationUnused,
  type LayoutCabinet,
  type LayoutCell,
} from "~/model/shelf"
import { cn } from "~/utils/cn"

import { usePulsePhase } from "./use-pulse-phase"

/**
 * The lane to fill and the lane either side of it, large: the drinks beside it
 * are what staff find it by on the real shelf, by sight, not by name. Framed and tinted as the same
 * three lanes are on the shelf front, and its "here" pulses with the shelf's,
 * so the two read as one place without a line between them. `fix` shows a red
 * lane to put right instead: its own drinks, in red, in place of "here".
 */
export function GuideLaneZoom({
  cabinet,
  fix = false,
  skuById,
  tall = false,
  targetCellId,
}: {
  cabinet: LayoutCabinet
  fix?: boolean
  skuById: Map<string, Sku>
  /** Fill the height it is given, with a larger "here": the guide's main picture. */
  tall?: boolean
  targetCellId: string
}) {
  const { t } = useTranslation("app")
  const { left, right } = getRowNeighbours(cabinet, targetCellId)
  const pulseRef = usePulsePhase(targetCellId)
  const target = fix
    ? cabinet.rows
        .flatMap((row) => row.cells)
        .find((cell) => cell.id === targetCellId)
    : undefined
  const fixSkuId = target
    ? (getCellDisplaySkuIds(target, skuById)[0] ?? "")
    : ""

  return (
    <div
      aria-hidden
      data-zoom-target
      className={cn(
        "flex min-h-32 w-full overflow-hidden rounded-xl border-4 border-dashed border-strong",
        tall ? "min-h-0 flex-1" : "h-48",
        fix ? "bg-error-subtle" : "bg-success-subtle"
      )}
    >
      <NeighbourSlot cell={left} skuById={skuById} />
      {/* The lanes are told apart by the two lines between them, as the
          shelf's lane dividers would. */}
      <div
        className={cn(
          "flex min-w-32 flex-1 animate-pulse items-center justify-center border-x-2 border-strong",
          fix
            ? "bg-error/40 p-3"
            : cn(
                "bg-success/40 font-bold text-success",
                tall ? "text-[5rem]" : "text-[3.25rem]"
              )
        )}
        ref={pulseRef}
      >
        {!fix ? (
          t("restockGuideZoomHere")
        ) : fixSkuId ? (
          <ProductThumb
            className="h-[90%] w-full"
            sku={skuById.get(fixSkuId)}
          />
        ) : null}
      </div>
      <NeighbourSlot cell={right} skuById={skuById} />
    </div>
  )
}

/**
 * A lane beside the target, without words, so it reads from across the
 * walk-in: its drink; a dashed drink when empty; stripes when it cannot be
 * used; past the cabinet's edge, the solid grey of the cabinet's frame.
 */
function NeighbourSlot({
  cell,
  skuById,
}: {
  /** Undefined past the cabinet's edge. */
  cell?: LayoutCell
  skuById: Map<string, Sku>
}) {
  const unused = Boolean(cell?.location && isLocationUnused(cell.location))
  const skuId =
    cell && !unused ? (getCellDisplaySkuIds(cell, skuById)[0] ?? "") : ""

  return (
    <div
      className={cn(
        "flex min-w-32 flex-1 items-center justify-center p-3",
        !cell
          ? "bg-(--border-color-strong)"
          : unused
            ? "bg-[repeating-linear-gradient(45deg,var(--text-color-disabled)_0_14px,var(--background-color-default)_14px_28px)]"
            : "bg-default"
      )}
    >
      {skuId ? (
        <ProductThumb className="h-[90%] w-full" sku={skuById.get(skuId)} />
      ) : cell && !unused ? (
        <EmptyBottle />
      ) : null}
    </div>
  )
}

/**
 * An empty lane, without words: the outline of the drink that is not there,
 * in a thick dashed line so it still reads from across the walk-in.
 */
function EmptyBottle() {
  return (
    <svg
      className="h-[70%] max-w-full text-disabled"
      fill="none"
      stroke="currentColor"
      strokeDasharray="14 10"
      strokeLinejoin="round"
      strokeWidth={7}
      viewBox="0 0 80 200"
    >
      <path d="M30 6h20v22c0 8 18 18 18 34v122a10 10 0 0 1-10 10H22a10 10 0 0 1-10-10V62c0-16 18-26 18-34Z" />
    </svg>
  )
}
