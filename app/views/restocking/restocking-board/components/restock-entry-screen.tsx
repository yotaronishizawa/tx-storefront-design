import type { ReactNode } from "react"

import { LayoutGrid, MapPin } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { Sku } from "~/api/opm/schemas"
import { ProductThumb } from "~/components/product/product-thumb"
import { Button } from "~/core"
import type { TakeOutItemView } from "~/domains/restocking"
import type { RestockEntryItemView } from "~/model/shelf"
import { cn } from "~/utils/cn"

import { LaneErrorBanner } from "./lane-error-banner"
import { useGuideWords } from "./use-guide-words"

/**
 * The restock study's list of drinks to restock, before entering and between
 * drinks inside: one list, top first, the emptiest display shelf leading. Why
 * a drink comes first shows as how empty its display shelf is, not as a
 * sentence. The count is there, but staff need not use it: the guide says
 * when to stop. No text under 18px.
 */
export function RestockEntryScreen({
  actions,
  errorCount,
  items,
  restocking,
  scanned,
  skuById,
  takeOutItems,
  onFixErrors,
  onShowBoard,
  onShowGuide,
}: {
  /** Start, resume or send, beside the robot control. */
  actions: ReactNode
  /** Red lanes left; while restocking, Send waits for them. */
  errorCount: number
  items: RestockEntryItemView[]
  /** In the walk-in, between drinks: ask for the next scan. */
  restocking: boolean
  /**
   * The drink scanned last. Still wanted: staff came back to see what is
   * next. Enough: the list asks for no more, so there is nowhere to send it.
   */
  scanned?: { enough: boolean; skuId: string }
  skuById: Map<string, Sku>
  /** Study: drinks to take out, as a second list beside the restock list. */
  takeOutItems?: TakeOutItemView[]
  onFixErrors: () => void
  /** Absent on the look-only list from Home: the board offers removals. */
  onShowBoard?: () => void
  /** Back to where the scanned drink goes. */
  onShowGuide: () => void
}) {
  const { t } = useTranslation("app")
  const showErrors = restocking && errorCount > 0
  // A drink off the list still has a guide; it leads the list so it is not lost.
  const scannedOffList =
    scanned !== undefined && !items.some((item) => item.skuId === scanned.skuId)
  const scannedRow = (skuId: string) =>
    scanned?.skuId === skuId
      ? scanned.enough
        ? ("enough" as const)
        : onShowGuide
      : undefined

  return (
    <section
      className={cn(
        "grid min-h-0 w-full min-w-0 flex-1 gap-4 overflow-hidden",
        showErrors
          ? "grid-rows-[auto_auto_minmax(0,1fr)]"
          : "grid-rows-[auto_minmax(0,1fr)]"
      )}
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0">
          <h2 className="text-display-lg/tight font-bold text-primary">
            {restocking ? t("restockEntryScanNext") : t("restockEntryTitle")}
          </h2>
          <p className="text-lg font-bold text-secondary">
            {t("restockEntryLead")}
          </p>
        </div>
        {/* A grid, so buttons that fill their cell keep to their own width. */}
        <div className="ml-auto grid grid-flow-col items-center gap-2">
          {/* While restocking, the guide shows the shelf; the whole board is
              reached only through the red lanes. */}
          {!restocking && onShowBoard && (
            <Button
              icon={<LayoutGrid />}
              size="lg"
              type="button"
              variant="secondary"
              onClick={onShowBoard}
            >
              {t("restockGuideShowBoard")}
            </Button>
          )}
          {actions}
        </div>
      </div>

      {showErrors && (
        <LaneErrorBanner
          count={errorCount}
          note={t("restockErrorsSendWaits")}
          onFix={onFixErrors}
        />
      )}

      {takeOutItems ? (
        // Two lists side by side: what goes in, what comes out. Each scrolls on its own.
        <div className="grid min-h-0 grid-cols-2 gap-4">
          <div className="flex min-h-0 flex-col gap-2">
            <h3 className="text-xl font-bold text-primary">
              {t("restockTakeOutPutIn")}
            </h3>
            <ol className="flex min-h-0 flex-col gap-3 overflow-y-auto pb-4">
              {scannedOffList && (
                <EntryRow
                  scanned={scannedRow(scanned.skuId)}
                  skuById={skuById}
                  skuId={scanned.skuId}
                />
              )}
              {items.map((item, index) => (
                <EntryRow
                  key={item.skuId}
                  item={item}
                  order={index + 1}
                  skuById={skuById}
                  skuId={item.skuId}
                  scanned={scannedRow(item.skuId)}
                />
              ))}
            </ol>
          </div>
          <div className="flex min-h-0 flex-col gap-2">
            <h3 className="text-xl font-bold text-primary">
              {t("restockTakeOutTitle")}
            </h3>
            {takeOutItems.length === 0 ? (
              <p className="text-lg text-secondary">
                {t("restockTakeOutNone")}
              </p>
            ) : (
              <ol className="flex min-h-0 flex-col gap-3 overflow-y-auto pb-4">
                {takeOutItems.map((item) => (
                  <TakeOutRow
                    key={`${item.reason}:${item.skuId}`}
                    item={item}
                    skuById={skuById}
                  />
                ))}
              </ol>
            )}
          </div>
        </div>
      ) : (
        <ol className="flex min-h-0 flex-col gap-3 overflow-y-auto pb-4">
          {scannedOffList && (
            <EntryRow
              scanned={scannedRow(scanned.skuId)}
              skuById={skuById}
              skuId={scanned.skuId}
            />
          )}
          {items.map((item, index) => (
            <EntryRow
              key={item.skuId}
              item={item}
              order={index + 1}
              skuById={skuById}
              skuId={item.skuId}
              scanned={scannedRow(item.skuId)}
            />
          ))}
        </ol>
      )}
    </section>
  )
}

/**
 * One drink. The one scanned last is the selected row: it says so under its
 * name, and the way back to its place stands where the display level was
 * (staff are already restocking it, so why it comes first no longer matters).
 * A drink the list wants no more of says so instead, with nowhere to go.
 */
function EntryRow({
  item,
  order,
  scanned,
  skuById,
  skuId,
}: {
  /** Missing for a scanned drink that is not on the list. */
  item?: RestockEntryItemView
  order?: number
  /** Set on the scanned drink's row only: back to its place, or enough. */
  scanned?: (() => void) | "enough"
  skuById: Map<string, Sku>
  skuId: string
}) {
  const { t } = useTranslation("app")
  const words = useGuideWords(skuById)
  const scanning = scanned !== undefined
  return (
    <li
      className={cn(
        "grid grid-cols-[auto_auto_minmax(0,1fr)_auto_auto] items-center gap-4 rounded-lg border-2 p-3",
        scanning
          ? "border-primary bg-primary-subtle"
          : "border-default bg-default"
      )}
    >
      <span className="w-8 text-center text-xl font-bold text-secondary">
        {order}
      </span>
      <ProductThumb className="h-16 w-8" sku={skuById.get(skuId)} />
      <div className="min-w-0">
        {/* Two lines, not one: beside the take-out list the row is half as wide. */}
        <p className="line-clamp-2 text-xl/tight font-bold text-primary">
          {words.name(skuId)}
        </p>
        {scanning && (
          <p className="text-base font-bold text-primary-text">
            {scanned === "enough"
              ? t("restockEntryEnough")
              : t("restockEntryScanning")}
          </p>
        )}
      </div>
      {/* Beside the display shelf's level: how many to bring for it. */}
      <p className="text-xl font-bold whitespace-nowrap text-primary">
        {item && t("restockEntryCount", { count: item.neededCount })}
      </p>
      {typeof scanned === "function" ? (
        <Button
          icon={<MapPin />}
          size="lg"
          type="button"
          variant="secondary"
          onClick={scanned}
        >
          {t("restockEntryShowGuide")}
        </Button>
      ) : scanning || item?.displayRatio == null ? (
        <span className="w-44" />
      ) : (
        <DisplayLevel ratio={item.displayRatio} urgent={item.urgent} />
      )}
    </li>
  )
}

/** How full the display shelf is: the reason for the order, without a sentence. */
function DisplayLevel({ ratio, urgent }: { ratio: number; urgent: boolean }) {
  const { t } = useTranslation("app")
  const percent = Math.round(Math.min(1, Math.max(0, ratio)) * 100)
  return (
    <div className="flex w-44 flex-col gap-1">
      <span
        className={cn(
          "text-base font-bold",
          urgent ? "text-error" : "text-secondary"
        )}
      >
        {urgent ? t("restockEntryDisplayLow") : t("restockEntryDisplay")}
      </span>
      <span
        aria-label={t("restockEntryDisplayLevel", { percent })}
        className="h-3 w-full overflow-hidden rounded-full bg-muted"
        role="img"
      >
        <span
          className={cn(
            "block h-full rounded-full",
            urgent ? "bg-error" : "bg-inverse/40"
          )}
          style={{ width: `${percent}%` }}
        />
      </span>
    </div>
  )
}

/** One drink to take out: why, and how many the stock shelf holds of it. */
function TakeOutRow({
  item,
  skuById,
}: {
  item: TakeOutItemView
  skuById: Map<string, Sku>
}) {
  const { t } = useTranslation("app")
  const words = useGuideWords(skuById)
  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-lg border-2 border-default bg-default p-3">
      <ProductThumb className="h-16 w-8" sku={skuById.get(item.skuId)} />
      <div className="min-w-0">
        <p className="truncate text-xl font-bold text-primary">
          {words.name(item.skuId)}
        </p>
        <p className="text-lg text-secondary">
          {item.reason === "offDisplay"
            ? t("restockTakeOutOffDisplay")
            : t("restockTakeOutAged")}
        </p>
      </div>
      <p className="text-xl font-bold whitespace-nowrap text-primary">
        {t("restockTakeOutCount", { count: item.count })}
      </p>
    </li>
  )
}
