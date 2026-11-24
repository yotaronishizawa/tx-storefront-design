import { CircleCheck } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { Sku } from "~/api/opm/schemas"
import { ProductThumb } from "~/components/product/product-thumb"
import { getLocalizedSkuName } from "~/model/sku"

/**
 * Which drink was read and how many more it needs, as a small heading: staff
 * hold the drink, and from the shelf a step or two away the name cannot be
 * read anyway, so the screen's room goes to where it goes instead.
 */
export function ScannedDrinkLine({
  remaining,
  sku,
  skuId,
}: {
  /** How many more to bring; missing when the guide has no lane for it. */
  remaining?: number
  sku?: Sku
  skuId: string
}) {
  const { i18n, t } = useTranslation("app")

  return (
    <section
      aria-label={t("scannedDrinkTitle")}
      aria-live="polite"
      className="flex min-w-0 items-center gap-3 rounded-xl bg-default py-2 pr-5 pl-4"
    >
      <CircleCheck aria-hidden className="size-7 shrink-0 text-success" />
      <span className="flex h-16 w-11 shrink-0 items-center justify-center">
        <ProductThumb className="size-full" sku={sku} />
      </span>
      {/* One line, cut with an ellipsis: the photo beside it tells the drink. */}
      <p className="min-w-0 truncate text-xl font-bold">
        {getLocalizedSkuName(sku, i18n.language) || skuId}
      </p>
      {remaining !== undefined && (
        <p className="shrink-0 text-xl text-secondary">
          {t("restockGuideLeftCount", { count: remaining })}
        </p>
      )}
    </section>
  )
}
