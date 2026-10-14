import type { Sku } from "~/api/opm/schemas"
import { getCellSkuId, type LayoutCell } from "~/model/shelf"
import { cn } from "~/utils/cn"

import { LaneCard } from "./lane-card"

const LANE_TILE_STATES = {
  idle: "border-transparent active:border-strong",
  selected: "border-transparent ring-3 ring-primary",
  /** An unsent edit in the layout editor. */
  edited: "border-success bg-success-subtle",
  /** Differs from the layout it is compared against. */
  diff: "border-error bg-error-subtle",
  "diff-selected": "border-error bg-error-subtle ring-3 ring-primary",
} as const

/**
 * A display lane at its own size, for boards that scroll rather than fill:
 * /display and the layout editor. `children` render on top, for badges.
 */
export function LaneTile({
  cell,
  className,
  skuById,
  state = "idle",
  ...props
}: LaneTile.Props) {
  const skuId = getCellSkuId(cell, "display")

  return (
    <LaneCard
      className={cn(
        "h-31.5 w-22",
        LANE_TILE_STATES[state],
        cell.isEmpty && "bg-subtle",
        className
      )}
      columnLabel={cell.column}
      sku={skuId ? skuById.get(skuId) : undefined}
      skuId={skuId}
      {...props}
    />
  )
}

export declare namespace LaneTile {
  type Props = Omit<LaneCard.Props, "columnLabel" | "sku" | "skuId"> & {
    cell: LayoutCell
    skuById: Map<string, Sku>
    state?: keyof typeof LANE_TILE_STATES
  }
}
