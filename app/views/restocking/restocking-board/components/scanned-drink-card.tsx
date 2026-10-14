import { useTranslation } from "react-i18next"

import type { Sku } from "~/api/opm/schemas"
import { ProductThumb } from "~/components/product/product-thumb"
import type { RecommendationRow } from "~/model/shelf"
import { getLocalizedSkuName, getSkuVolume } from "~/model/sku"
import { cn } from "~/utils/cn"

type ScanStatus = "idle" | "notRecommended" | "needed" | "complete"

const STATUS_STYLES = {
  complete: "bg-muted text-secondary",
  idle: "bg-subtle text-secondary",
  needed: "bg-success text-inverse",
  notRecommended: "bg-subtle text-secondary",
} as const satisfies Record<ScanStatus, string>

function getScanStatus(
  scanned: boolean,
  row: RecommendationRow | undefined
): ScanStatus {
  if (!scanned) {
    return "idle"
  }
  if (!row) {
    return "notRecommended"
  }
  return row.neededCount > 0 ? "needed" : "complete"
}

export function ScannedDrinkCard({
  currentCount,
  row,
  sku,
  skuId,
}: {
  /** Used when the drink has no row on the required list. */
  currentCount: number
  row?: RecommendationRow
  sku?: Sku
  /** Empty until something is scanned; the card keeps its size either way. */
  skuId: string
}) {
  const { i18n, t } = useTranslation("app")
  const scanned = Boolean(skuId)
  const needed = row?.neededCount ?? 0
  const status = getScanStatus(scanned, row)
  const statusText = {
    complete: t("scannedDrinkComplete"),
    idle: t("restockingScanHint"),
    needed: t("scannedDrinkNeeded", { count: needed }),
    notRecommended: t("scannedDrinkNotRecommended"),
  }[status]

  return (
    <section
      aria-live="polite"
      className={cn(
        "overflow-hidden rounded-lg border-2 bg-default",
        status === "needed" ? "border-success" : "border-default"
      )}
    >
      <div className="grid grid-cols-[32px_minmax(0,1fr)] items-center gap-2 p-2">
        {scanned ? (
          <ProductThumb className="h-16 w-8" sku={sku} />
        ) : (
          <span className="h-16 w-8 rounded-sm bg-muted" />
        )}
        <div className="min-w-0">
          <p className="truncate text-xs/tight font-bold">
            {scanned ? (
              <>
                {getLocalizedSkuName(sku, i18n.language) || skuId}
                <span className="ml-1 font-normal text-secondary">
                  {getSkuVolume(sku)}
                </span>
              </>
            ) : (
              <span className="font-normal text-disabled">-</span>
            )}
          </p>
          <dl className="mt-1 grid grid-cols-3 gap-1 text-center">
            <Stat
              label={t("recommendedCountLabel")}
              value={scanned ? (row?.recommendationCount ?? "-") : "-"}
            />
            <Stat
              label={t("smartShelfStockLabel")}
              value={scanned ? (row?.currentCount ?? currentCount) : "-"}
            />
            <Stat
              emphasized={status === "needed"}
              label={t("neededShortLabel")}
              value={scanned && row ? needed : "-"}
            />
          </dl>
        </div>
      </div>

      <p
        className={cn(
          "px-2 py-1 text-center text-xs font-bold",
          STATUS_STYLES[status]
        )}
      >
        {statusText}
      </p>
    </section>
  )
}

function Stat({
  emphasized = false,
  label,
  value,
}: {
  emphasized?: boolean
  label: string
  value: number | string
}) {
  return (
    <div
      className={cn("rounded-sm bg-subtle", emphasized && "bg-success-subtle")}
    >
      <dt className="truncate text-xs text-secondary">{label}</dt>
      <dd className="text-base/tight font-bold">{value}</dd>
    </div>
  )
}
