import { useRef, type ReactNode } from "react"

import { ArrowLeft } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { Sku } from "~/api/opm/schemas"
import { Button } from "~/core"
import {
  getStockLocationSkuIds,
  type LaneErrorSummary,
  type LayoutCabinet,
  type LayoutCell,
  type RestockGuideView,
} from "~/model/shelf"
import { cn } from "~/utils/cn"

import { GuideFixCard } from "./guide-fix-card"
import { GuideLaneZoom } from "./guide-lane-zoom"
import { GuideShelfFront } from "./guide-shelf-front"
import { LaneErrorBanner } from "./lane-error-banner"
import { ZoomLeaderLines } from "./zoom-leader-lines"

/** A red lane to put right, shown where the guide shows a lane to fill. */
export type GuideFix = {
  cell: LayoutCell
  /** Red lanes left, this one included. */
  left: number
  /** The red lanes after this one. */
  otherCellIds: string[]
  summary: LaneErrorSummary
  /**
   * Put as the picture and still red: the recovery steps, which weigh it
   * again and only then hand it to the operations centre.
   */
  onRecover: () => void
}

/**
 * The restock study's screen for the iPad carried into the walk-in: read from
 * a step or two away, at the standby screen's sizes, beside the shelf front.
 * With `fix`, the same screen shows a red lane to put right instead: the same
 * cabinet row, shelf front and zoom, in red, with what to do in place of the
 * scanned drink.
 */
export function RestockGuideScreen({
  cabinets,
  errorCountByCabinet,
  fix,
  guide,
  lastPlacement,
  scannedDrink,
  skuById,
  onFixErrors,
  onShowList,
  onShowGuide,
}: {
  /** Every stock cabinet, left to right as staff face them. */
  cabinets: LayoutCabinet[]
  /** Red lanes, by cabinet. */
  errorCountByCabinet: ReadonlyMap<number, number>
  fix?: GuideFix
  /** Missing while fixing from the list, before any scan. */
  guide?: RestockGuideView
  /** The lane a drink last went in; a new `key` is a new drink. */
  lastPlacement?: { cellId: string; key: string }
  /** The scanned drink, as a small heading at the top right. */
  scannedDrink: ReactNode
  skuById: Map<string, Sku>
  /** To the red lanes. */
  onFixErrors: () => void
  /** Back to the list of drinks, to see what comes next. */
  onShowList: () => void
  /** While fixing, set when a drink was being guided: back to its lane. */
  onShowGuide?: () => void
}) {
  const { t } = useTranslation(["app", "common"])
  const target = guide?.target
  const place = fix
    ? { cabinet: fix.cell.cabinet, cellId: fix.cell.id, row: fix.cell.row }
    : target
  const cabinet =
    cabinets.find((item) => item.cabinet === place?.cabinet) ?? cabinets[0]
  const sectionRef = useRef<HTMLElement>(null)
  const errorCount = [...errorCountByCabinet.values()].reduce(
    (total, count) => total + count,
    0
  )
  // The same red-lane banner on both sides; while fixing it has no button.
  const top = fix ? (
    <LaneErrorBanner count={fix.left} />
  ) : (
    errorCount > 0 && <LaneErrorBanner count={errorCount} onFix={onFixErrors} />
  )

  return (
    <section
      ref={sectionRef}
      className="relative grid min-h-0 w-full min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)] gap-x-10 gap-y-4 overflow-hidden p-2"
    >
      {/* The top row: the way back, where screens keep it (the top left;
          fixing on the way through a drink goes back to that drink's lane,
          otherwise to the list), and beside it, across the rest of the
          width, the red lanes left. The row keeps the banner's height when
          there is none, so nothing below moves as lanes turn red or clear. */}
      <div className="col-span-2 flex min-h-23 items-center gap-4">
        <Button
          icon={<ArrowLeft />}
          size="lg"
          type="button"
          variant="secondary"
          onClick={onShowGuide ?? onShowList}
        >
          {onShowGuide ? t("restockEntryShowGuide") : t("restockEntryBack")}
        </Button>
        <div className="min-w-0 flex-1">{top}</div>
        {!fix && <div className="max-w-[45%] min-w-0">{scannedDrink}</div>}
      </div>
      <div className="flex h-full min-h-0 flex-col items-center gap-3">
        {cabinets.length > 1 && (
          <ShelfOverview
            cabinets={cabinets}
            current={cabinet?.cabinet}
            errorCountByCabinet={errorCountByCabinet}
          />
        )}
        {/* A definite height, so the 608 × 898 width follows from it; with
            the overview, its 6rem row and the gap come off. */}
        <div
          className={cn(
            "aspect-608/898 min-h-0",
            cabinets.length > 1 ? "h-[calc(100%-6.75rem)]" : "h-full"
          )}
        >
          {cabinet && (
            <GuideShelfFront
              cabinet={cabinet}
              fix={Boolean(fix)}
              flash={fix ? undefined : lastPlacement}
              nextCellIds={fix ? [] : guide?.nextCellIds}
              otherFixCellIds={fix?.otherCellIds}
              skuById={skuById}
              targetCellId={place?.cellId}
              targetRow={place?.row}
            />
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-4 overflow-hidden pr-2">
        {/* Guiding, the zoom takes the whole column: where the drink goes is
            what has to read from across the walk-in. Fixing, the card of
            what to do sits under it. */}
        <div
          className={cn(
            "flex min-h-0 max-w-full flex-col gap-8 self-stretch",
            !fix && "flex-1"
          )}
        >
          {place && cabinet && (
            <GuideLaneZoom
              cabinet={cabinet}
              fix={Boolean(fix)}
              skuById={skuById}
              tall={!fix}
              targetCellId={place.cellId}
            />
          )}
          {fix && (
            <GuideFixCard
              skuById={skuById}
              skuIds={
                fix.cell.location
                  ? getStockLocationSkuIds(fix.cell.location)
                  : []
              }
              summary={fix.summary}
              onRecover={fix.onRecover}
            />
          )}
        </div>
        {!place && (
          <p className="text-display-lg/tight font-bold text-primary">
            {t("restockGuideNone")}
          </p>
        )}
      </div>
      {place && (
        <ZoomLeaderLines container={sectionRef} laneKey={place.cellId} />
      )}
    </section>
  )
}

/**
 * Which cabinet: every cabinet in a row as staff face them, touching as the
 * real ones do, each drawn as a small shelf (its boards, no lanes). No names:
 * the row itself says which is which. The one shown is framed dark, and a
 * cabinet with red lanes carries their count at its top right.
 */
function ShelfOverview({
  cabinets,
  current,
  errorCountByCabinet,
}: {
  cabinets: LayoutCabinet[]
  current?: number
  errorCountByCabinet: ReadonlyMap<number, number>
}) {
  return (
    <div aria-hidden className="flex h-24 shrink-0 pt-4">
      {cabinets.map((item, index) => {
        const isCurrent = item.cabinet === current
        const count = errorCountByCabinet.get(item.cabinet) ?? 0
        return (
          <span
            key={item.cabinet}
            className={cn(
              "relative flex aspect-608/898 h-full flex-col justify-evenly border-3 px-1.5",
              index > 0 && "-ml-0.75",
              isCurrent
                ? "z-10 border-(--background-color-inverse) bg-app"
                : "border-(--text-color-disabled) bg-default"
            )}
          >
            {item.rows.slice(1).map((row) => (
              <span
                key={row.row}
                className={cn(
                  "h-0.5",
                  isCurrent ? "bg-inverse" : "bg-(--text-color-disabled)"
                )}
              />
            ))}
            {count > 0 && (
              <span className="absolute -top-4 -right-0.75 z-20 flex h-8 min-w-8 items-center justify-center rounded-full border-2 border-(--background-color-subtle) bg-error px-2 text-lg font-bold text-inverse">
                {count}
              </span>
            )}
          </span>
        )
      })}
    </div>
  )
}
