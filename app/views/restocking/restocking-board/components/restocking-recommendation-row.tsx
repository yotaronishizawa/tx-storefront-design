import { useTranslation } from "react-i18next"

import { ProductThumb } from "~/components/product/product-thumb"
import { useScrollIntoView } from "~/hooks/use-scroll-into-view"
import type { RecommendationRow } from "~/model/shelf"
import { getLocalizedSkuName } from "~/model/sku"
import { cn } from "~/utils/cn"

export const RECOMMENDATION_GRID =
  "grid grid-cols-[minmax(0,1fr)_50px_50px_50px] xl:grid-cols-[minmax(0,1fr)_56px_56px_56px]"

/** A `highlighted` row is the scanned drink's and scrolls into view; it turns red once none are needed. */
export function RecommendationRowCard({
  highlighted = false,
  row,
}: {
  highlighted?: boolean
  row: RecommendationRow
}) {
  const { i18n } = useTranslation()
  const ref = useScrollIntoView<HTMLElement>(highlighted)

  let background = "bg-default"
  if (highlighted && row.neededCount > 0) {
    background = "bg-primary-subtle ring-2 ring-primary ring-inset"
  } else if (highlighted) {
    background = "bg-error-subtle ring-2 ring-error ring-inset"
  }

  return (
    <article
      ref={ref}
      aria-current={highlighted || undefined}
      className={cn(
        RECOMMENDATION_GRID,
        "min-h-12 items-center overflow-hidden rounded-md px-1.5 text-center text-base font-normal",
        background
      )}
      role="row"
    >
      <div
        className="grid min-w-0 grid-cols-[24px_minmax(0,1fr)] items-center gap-1.5 py-0.5 pr-1 text-left xl:grid-cols-[28px_minmax(0,1fr)]"
        role="cell"
      >
        <ProductThumb className="h-10 w-6 xl:w-7" sku={row.sku} />
        <span className="line-clamp-2 min-w-0 text-xs/tight font-medium xl:text-xs/tight">
          {getLocalizedSkuName(row.sku, i18n.language) || row.skuId}
        </span>
      </div>
      <span className="border-l border-default" role="cell">
        {row.recommendationCount}
      </span>
      <span className="border-l border-default" role="cell">
        {row.currentCount}
      </span>
      <span
        className={cn(
          "border-l border-default",
          row.neededCount > 0 && "font-bold"
        )}
        role="cell"
      >
        {row.neededCount}
      </span>
    </article>
  )
}
