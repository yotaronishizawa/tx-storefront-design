import { useTranslation } from "react-i18next"

import type { Sku } from "~/api/opm/schemas"
import { ProductThumb } from "~/components/product/product-thumb"
import { LaneBadge } from "~/components/shelf/stock-lane/lane-badge"
import {
  getLaneBadge,
  getLaneTone,
} from "~/components/shelf/stock-lane/lane-states"
import { LANE_TONES } from "~/components/shelf/stock-lane/stock-lane"
import { Button } from "~/core"
import {
  getCellDisplaySkuIds,
  getColumnLabel,
  isLocationBlocked,
  type LayoutCabinet,
  type RestockingPlacementState,
} from "~/model/shelf"
import { cn } from "~/utils/cn"

/**
 * Variant B's shelf: every row and lane of one cabinet, squeezed to the
 * panel's width as in Masaya's map (the design system's ShelfGrid keeps lanes
 * a minimum width and scrolls, and its lane shows a volume line this panel has
 * no height for). Each lane keeps his photo and number; colours, the error
 * badge and the last-added ring are StockLane's.
 */
export function RestockVariantBShelfMap({
  cabinet,
  laneAddedCounts,
  lastAddedLaneId,
  placement,
  skuById,
  onOpenLane,
}: {
  cabinet?: LayoutCabinet
  laneAddedCounts: ReadonlyMap<string, number>
  lastAddedLaneId: string
  placement?: RestockingPlacementState
  skuById: Map<string, Sku>
  onOpenLane: (laneId: string) => void
}) {
  const { t } = useTranslation(["app", "common"])
  if (!cabinet) {
    return null
  }
  const columns = Math.max(1, ...cabinet.rows.map((row) => row.cells.length))
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {cabinet.rows.map((row) => (
        <div key={row.row} className="flex min-h-0 flex-1 gap-2">
          <span className="flex w-16 shrink-0 items-center justify-center text-base font-bold whitespace-nowrap text-primary">
            {t("workflow.manual.row", { number: row.row })}
          </span>
          <div
            className="grid min-h-0 min-w-0 flex-1 gap-1"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }}
          >
            {row.cells.map((cell) => {
              const skuId = getCellDisplaySkuIds(cell, skuById)[0] ?? ""
              const tone = getLaneTone(cell, {
                aged: false,
                misplaced: false,
                restockingPlacement: placement,
              })
              const badge = getLaneBadge(cell, {
                aged: false,
                misplaced: false,
              })
              const blocked = Boolean(
                cell.location && isLocationBlocked(cell.location)
              )
              const added = laneAddedCounts.get(cell.id) ?? 0
              return (
                <Button
                  key={cell.id}
                  aria-label={t("workflow.restock.location", {
                    cabinet: cell.cabinet,
                    row: cell.row,
                    lane: getColumnLabel(cell, row, "stock"),
                  })}
                  className={cn(
                    "relative flex min-h-0 min-w-0 flex-col rounded-md border-2 bg-default p-0.5",
                    LANE_TONES[tone],
                    blocked && tone !== "unused" && "opacity-40",
                    cell.id === lastAddedLaneId &&
                      tone !== "error" &&
                      "ring-3 ring-info"
                  )}
                  disabled={cell.isEmpty || blocked}
                  size="unstyled"
                  type="button"
                  variant="unstyled"
                  onClick={() => onOpenLane(cell.id)}
                >
                  <span className="flex min-h-0 w-full flex-1 items-end justify-center">
                    {skuId && tone !== "unused" && (
                      <ProductThumb
                        className="h-full max-w-full"
                        sku={skuById.get(skuId)}
                      />
                    )}
                  </span>
                  <span className="w-full shrink-0 rounded-full bg-muted text-base/6 font-bold text-primary tabular-nums">
                    {getColumnLabel(cell, row, "stock")}
                  </span>
                  {added > 0 && tone !== "unused" && (
                    <span
                      aria-label={t("laneAddedCount", { count: added })}
                      className="absolute top-0.5 right-0.5 rounded-full bg-success px-1.5 text-base/5 font-bold text-inverse"
                    >
                      +{added}
                    </span>
                  )}
                  {badge && (
                    <LaneBadge
                      className="absolute -top-1.5 -right-1.5 z-10 size-5 ring-2 ring-white"
                      kind={badge}
                    />
                  )}
                </Button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
