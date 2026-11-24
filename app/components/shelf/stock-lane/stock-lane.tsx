import { useTranslation } from "react-i18next"

import type { Sku } from "~/api/opm/schemas"
import { useScrollIntoView } from "~/hooks/use-scroll-into-view"
import {
  getCellDisplaySkuIds,
  getCellSkuIds,
  isLocationBlocked,
  type LayoutCell,
  type RestockingPlacementState,
} from "~/model/shelf"
import { cn } from "~/utils/cn"

import { LaneCard } from "../lane-card"
import { LaneBadge } from "./lane-badge"
import { getLaneBadge, getLaneTone, type LaneTone } from "./lane-states"

/** Each lane tone as classes; shared with boards that draw lanes their own size. */
export const LANE_TONES = {
  canPlace: "border-success bg-success-subtle",
  cannotPlace: "border-transparent bg-muted opacity-50 grayscale",
  empty: "border-transparent bg-default/70",
  error: "border-error bg-error-subtle",
  idle: "border-transparent active:border-strong",
  // The unused overlay covers the cell, so only the border shows through.
  unused: "border-transparent",
  warning: "border-warning bg-warning-subtle",
} as const satisfies Record<LaneTone, string>

/** A stock-shelf lane on a board that fills its panel; restocking and manual replenishment share it. */
export function StockLane({
  addedCount = 0,
  aged = false,
  cell,
  columnLabel,
  flashSignal = 0,
  guideRole,
  lastAdded = false,
  misplaced = false,
  restockingPlacement,
  selected,
  selectedCellScrollSignal = 0,
  skuById,
  toRemoveCount = 0,
  onSelect,
}: {
  addedCount?: number
  aged?: boolean
  cell: LayoutCell
  columnLabel: number
  /** Replays the green flash whenever it changes; 0 never flashes. */
  flashSignal?: number
  /**
   * Restock study: the lane to fill now (`target`), one planned after it
   * (`next`), or a lane off the guided row (`dimmed`).
   */
  guideRole?: "dimmed" | "next" | "target"
  lastAdded?: boolean
  misplaced?: boolean
  restockingPlacement?: RestockingPlacementState
  selected: boolean
  selectedCellScrollSignal?: number
  skuById: Map<string, Sku>
  /** Drinks of the SKU being removed, shown where the added count goes. */
  toRemoveCount?: number
  onSelect: () => void
}) {
  const { t } = useTranslation("app")
  const scrollRef = useScrollIntoView<HTMLButtonElement>(
    selected,
    selectedCellScrollSignal
  )
  const rawSkuIds = getCellSkuIds(cell)
  const skuId = getCellDisplaySkuIds(cell, skuById)[0] ?? ""
  const sku = skuId ? skuById.get(skuId) : undefined
  const tone = getLaneTone(cell, { aged, misplaced, restockingPlacement })
  const badge = getLaneBadge(cell, { aged, misplaced })
  const unused = tone === "unused"
  const hasError = tone === "error"
  // A blacklisted lane does not open.
  const blocked = Boolean(cell.location && isLocationBlocked(cell.location))

  return (
    <LaneCard
      ref={scrollRef}
      className={cn(LANE_TONES[tone], {
        // Rings in hues no tone uses, so they stay readable over any tone.
        "ring-3 ring-primary": selected,
        // The unused overlay already says why the lane does not open.
        "disabled:opacity-100": unused,
        "ring-3 ring-info": lastAdded && !selected && !hasError,
        "opacity-40": (blocked && !unused) || guideRole === "dimmed",
        "border-dashed border-success": guideRole === "next",
        "animate-pulse border-dashed border-success bg-success-subtle ring-4 ring-success":
          guideRole === "target",
      })}
      columnLabel={columnLabel}
      disabled={cell.isEmpty || blocked}
      flashSignal={flashSignal}
      sku={sku}
      skuId={skuId}
      onClick={onSelect}
    >
      {guideRole === "next" && (
        <span className="absolute top-5 left-1/2 z-10 -translate-x-1/2 rounded-full bg-success px-1.5 text-base/5 font-bold text-inverse">
          {t("restockGuideNextLane")}
        </span>
      )}
      {unused && (
        <span className="pointer-events-none absolute inset-1 z-20 flex items-center justify-center rounded-sm bg-inverse/70 px-1 text-xs font-bold tracking-widest text-inverse uppercase">
          {t("laneUnused")}
          {rawSkuIds.length > 1 && (
            <span className="absolute right-1 bottom-1 rounded-sm bg-inverse/90 px-1 text-xs tracking-normal">
              x{rawSkuIds.length}
            </span>
          )}
        </span>
      )}
      {toRemoveCount > 0 && addedCount === 0 && !unused && (
        <span
          aria-label={t("skuRemovalLaneCount", { count: toRemoveCount })}
          className="absolute right-1 bottom-1 z-10 rounded-full bg-error px-1.5 text-xs/4 font-bold text-inverse"
        >
          {toRemoveCount}
        </span>
      )}
      {addedCount > 0 && !unused && (
        <span
          aria-label={t("laneAddedCount", { count: addedCount })}
          className="absolute right-1 bottom-1 z-10 rounded-full bg-success px-1.5 text-xs/4 font-bold text-inverse"
        >
          +{addedCount}
        </span>
      )}
      {badge && (
        <LaneBadge
          className="absolute -top-1.5 -right-1.5 z-10 size-5 ring-2 ring-white"
          kind={badge}
        />
      )}
    </LaneCard>
  )
}
