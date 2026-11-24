import type { ReactNode } from "react"

import { CircleCheck, LayoutGrid, PackageCheck, ScanLine } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { Sku } from "~/api/opm/schemas"
import { PanelTitle } from "~/components/layout/panel-title"
import { ProductThumb } from "~/components/product/product-thumb"
import {
  CabinetTabs,
  type CabinetSummary,
} from "~/components/shelf/cabinet-tabs"
import { LaneLegend } from "~/components/shelf/stock-lane/lane-legend"
import type { LaneLegendKey } from "~/components/shelf/stock-lane/lane-states"
import { useActiveCabinet } from "~/components/shelf/use-active-cabinet"
import { Button, Notice } from "~/core"
import {
  findCell,
  findRow,
  getColumnLabel,
  type LayoutCabinet,
  type RecommendationRow,
  type RestockingPlacementState,
} from "~/model/shelf"
import { getLocalizedSkuName, getSkuVolume } from "~/model/sku"

import { RestockVariantBShelfMap } from "./restock-variant-b-shelf-map"

/**
 * Restock study, variant B: Masaya's restocking screen
 * (tx-storefront feat/mr-pick-plan-study, 3403535), kept as he laid it out —
 * one screen, the scanned drink on the left beside the whole stock shelf on
 * the right, no screen to switch to — and drawn with the design system's own
 * parts: StockLane's lane colours, CabinetTabs, LaneLegend, Notice, lg buttons.
 * His "change this drink's display layout" is left out: the prototype has no
 * layout editing behind it.
 */
export function RestockVariantBScreen({
  actions,
  board,
  cabinetSummaries,
  currentCount,
  laneAddedCounts,
  lastAddedLaneId,
  placement,
  presentLaneStates,
  robotArm,
  row,
  sku,
  skuById,
  skuId,
  onOpenLane,
  onShowBoard,
}: {
  /** The end button, at the top right as in his screen. */
  actions: ReactNode
  board: LayoutCabinet[]
  cabinetSummaries: ReadonlyMap<number, CabinetSummary>
  /** On the stock shelf now, when the recommendations have no row for it. */
  currentCount: number
  laneAddedCounts: ReadonlyMap<string, number>
  lastAddedLaneId: string
  placement?: RestockingPlacementState
  presentLaneStates: ReadonlySet<LaneLegendKey>
  /** Moving the robot, in the footer as in his screen. */
  robotArm: ReactNode
  row?: RecommendationRow
  sku?: Sku
  skuById: Map<string, Sku>
  /** Scanned in this visit; empty before the first scan. */
  skuId: string
  onOpenLane: (laneId: string) => void
  onShowBoard: () => void
}) {
  const { i18n, t } = useTranslation("app")
  const lastAdded = findCell(board, lastAddedLaneId)
  const lastAddedRow = findRow(board, lastAddedLaneId)
  const addedCount = laneAddedCounts.get(lastAddedLaneId) ?? 0
  // Follows the drink just put in to its cabinet.
  const [cabinet, setCabinet] = useActiveCabinet(
    board,
    skuId ? lastAdded?.cabinet : undefined,
    addedCount
  )
  const scanned = Boolean(skuId)

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
      <header className="flex shrink-0 items-center justify-between gap-4">
        <div className="flex min-w-0 items-baseline gap-4">
          <h1 className="text-xl font-bold text-primary">
            {t("workflow.restock.title")}
          </h1>
          <span className="text-lg text-secondary">
            {t("workflow.restock.active")}
          </span>
        </div>
        <div className="flex shrink-0 gap-3">{actions}</div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,0.8fr)_minmax(0,1.5fr)] gap-4">
        <section
          aria-live="polite"
          className="flex min-h-0 min-w-0 flex-col gap-4 rounded-lg border bg-default p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <PanelTitle title={t("workflow.restock.currentProduct")} />
            {scanned && (
              <span className="flex items-center gap-2 text-lg font-bold text-primary">
                <CircleCheck aria-hidden className="size-6 text-success" />
                {t("workflow.restock.accepted")}
              </span>
            )}
          </div>
          {scanned ? (
            <>
              <div className="flex min-h-0 flex-1 flex-col justify-center gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <ProductThumb className="h-24 w-14 shrink-0" sku={sku} />
                  <div className="min-w-0">
                    <h2 className="text-xl/snug font-bold wrap-break-word text-primary">
                      {getLocalizedSkuName(sku, i18n.language) || skuId}
                    </h2>
                    <p className="mt-1 text-lg text-secondary">
                      {getSkuVolume(sku)}
                    </p>
                  </div>
                </div>
                <dl className="grid grid-cols-2 gap-3 border-t pt-4">
                  <div>
                    <dt className="text-base text-secondary">
                      {t("workflow.restock.recommendation")}
                    </dt>
                    <dd className="mt-1 text-xl font-bold tabular-nums">
                      {row
                        ? t("workflow.manual.quantity", {
                            count: row.neededCount,
                          })
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-base text-secondary">
                      {t("workflow.restock.stockOnShelfLabel")}
                    </dt>
                    <dd className="mt-1 text-xl font-bold tabular-nums">
                      {t("workflow.manual.quantity", {
                        count: row?.currentCount ?? currentCount,
                      })}
                    </dd>
                  </div>
                </dl>
              </div>
              <Notice icon={ScanLine} tone="info">
                {t("workflow.restock.nextScan")}
              </Notice>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
              <img
                alt=""
                className="h-28 w-full object-contain"
                draggable={false}
                src="/assets/home/restock.png"
              />
              <h2 className="text-xl font-bold text-primary">
                {t("workflow.restock.scanFirst")}
              </h2>
              <p className="max-w-96 text-base text-secondary">
                {t("workflow.restock.scanFirstHint")}
              </p>
            </div>
          )}
        </section>

        <section className="flex min-h-0 min-w-0 flex-col gap-3 rounded-lg border bg-default p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <PanelTitle title={t("everydayRestock.title")} />
            {board.length > 1 && (
              <CabinetTabs
                board={board}
                kind="stock"
                summaries={cabinetSummaries}
                value={cabinet?.cabinet}
                onChange={setCabinet}
              />
            )}
          </div>
          <div className="flex min-h-7 items-center justify-between gap-3">
            {/* His line for a scan whose fitting lanes are not known. The
                shelf hub now takes the scan, so OPM is not asked which lanes
                the drink fits (restocking-scan.ts): no lane turns green. */}
            {scanned && !placement?.compatibilityKnown ? (
              <span className="flex items-center gap-2 text-base text-secondary">
                <ScanLine aria-hidden className="size-5 shrink-0" />
                {t("everydayRestock.unknown")}
              </span>
            ) : (
              <span />
            )}
            <LaneLegend present={presentLaneStates} />
          </div>
          <RestockVariantBShelfMap
            cabinet={cabinet}
            laneAddedCounts={laneAddedCounts}
            lastAddedLaneId={lastAddedLaneId}
            placement={placement}
            skuById={skuById}
            onOpenLane={onOpenLane}
          />
          {scanned && lastAdded && lastAddedRow && addedCount > 0 ? (
            <Notice
              icon={PackageCheck}
              title={t("everydayRestock.observed", { count: addedCount })}
              tone="success"
            >
              {t("workflow.restock.location", {
                cabinet: lastAdded.cabinet,
                row: lastAdded.row,
                lane: getColumnLabel(lastAdded, lastAddedRow, "stock"),
              })}
            </Notice>
          ) : (
            <Notice icon={PackageCheck}>
              {t(
                scanned
                  ? "everydayRestock.capacityHint"
                  : "everydayRestock.afterScan"
              )}
            </Notice>
          )}
        </section>
      </div>

      <footer className="flex shrink-0 items-center gap-3 border-t pt-3">
        <Button
          icon={<LayoutGrid />}
          size="lg"
          type="button"
          variant="secondary"
          onClick={onShowBoard}
        >
          {t("workflow.restock.shelfOverview")}
        </Button>
        <div className="ml-auto">{robotArm}</div>
      </footer>
    </section>
  )
}
