import type { ReactNode } from "react"

import { Search, X } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { Sku } from "~/api/opm/schemas"
import { Button } from "~/core"
import {
  getCellSkuIds,
  getShelfPosition,
  type LayoutCabinet,
} from "~/model/shelf"
import { cn } from "~/utils/cn"

import { BoardShelfFront } from "./board-shelf-front"
import { useGuideWords } from "./use-guide-words"

/**
 * The restock study's whole-shelf screen: not part of the usual loop (list,
 * scan, place), but where staff come when something is wrong or to check.
 * It answers three things: is anything to fix, what is on the shelves, and
 * can the restock end. Every cabinet stands side by side as staff face
 * them; a lane's detail opens only when one is tapped. No text under 18px.
 */
export function RestockBoardScreen({
  actions,
  backLabel,
  cabinets,
  errorLaneIds,
  foundSkuId,
  selectedCellId,
  skuById,
  targetCellId,
  onBack,
  onClearFound,
  onFind,
  onSelectLane,
}: {
  /** The robot control and start, resume or send. */
  actions: ReactNode
  backLabel: string
  cabinets: LayoutCabinet[]
  errorLaneIds: string[]
  /** The drink being looked up; its lanes are marked. */
  foundSkuId: string
  selectedCellId: string
  skuById: Map<string, Sku>
  /** Where the drink in hand goes, while restocking. */
  targetCellId: string
  onBack: () => void
  onClearFound: () => void
  onFind: () => void
  onSelectLane: (cellId: string) => void
}) {
  const { t } = useTranslation("app")
  const words = useGuideWords(skuById)
  const errorCellIds = new Set(errorLaneIds)
  const foundCellIds = new Set(
    foundSkuId
      ? cabinets.flatMap((cabinet) =>
          cabinet.rows.flatMap((row) =>
            row.cells
              .filter((cell) => getCellSkuIds(cell).includes(foundSkuId))
              .map((cell) => cell.id)
          )
        )
      : []
  )
  const marks = {
    errorCellIds,
    foundCellIds,
    selectedCellId,
    targetCellId,
  }

  return (
    <section className="grid min-h-0 w-full min-w-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-bold text-primary">
          {t("restockBoardTitle")}
        </h2>
        <span
          className={cn(
            "rounded-md px-3 py-1 text-lg font-bold",
            errorLaneIds.length > 0
              ? "bg-error text-inverse"
              : "bg-success-subtle text-primary"
          )}
          role="status"
        >
          {errorLaneIds.length > 0
            ? t("restockBoardToFix", { count: errorLaneIds.length })
            : t("restockBoardNothingToFix")}
        </span>
        {foundSkuId && (
          <span className="flex items-center gap-2 rounded-md bg-primary-subtle px-3 py-1 text-lg font-bold text-primary">
            {t("restockBoardFound", { sku: words.name(foundSkuId) })}
            <Button
              aria-label={t("restockBoardClearFound")}
              icon={<X />}
              size="sm"
              type="button"
              variant="secondary"
              onClick={onClearFound}
            />
          </span>
        )}
        {/* A grid, so buttons that fill their cell keep to their own width. */}
        <div className="ml-auto grid grid-flow-col items-center gap-2">
          <Button size="lg" type="button" variant="secondary" onClick={onBack}>
            {backLabel}
          </Button>
          <Button
            icon={<Search />}
            size="lg"
            type="button"
            variant="secondary"
            onClick={onFind}
          >
            {t("restockBoardFind")}
          </Button>
          {actions}
        </div>
      </div>

      {/* Three cabinets side by side: each as tall as fits both the height
          and a third of the width, at 608 × 898. */}
      <div className="@container flex min-h-0 items-start justify-center gap-6">
        {cabinets.map((cabinet) => (
          <div
            key={cabinet.cabinet}
            className="flex h-full flex-col items-center gap-2"
          >
            <div
              className="aspect-608/898"
              style={{
                height: `min(100% - 2.5rem, (100cqw - ${(cabinets.length - 1) * 1.5}rem) / ${cabinets.length} * 898 / 608)`,
              }}
            >
              <BoardShelfFront
                cabinet={cabinet}
                marks={marks}
                skuById={skuById}
                onSelect={onSelectLane}
              />
            </div>
            <span className="text-lg font-bold text-secondary">
              {words.shelf(getShelfPosition(cabinets, cabinet.cabinet))}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
