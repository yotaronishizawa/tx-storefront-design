import { useTranslation } from "react-i18next"

import type { Sku } from "~/api/opm/schemas"
import { getLocalizedSkuName, getSkuImageUrl, isCutProduct } from "~/model/sku"
import { cn } from "~/utils/cn"

/** `markCut` replaces a cut product's image with a "cut" label. */
export function ProductThumb({
  className = "h-14 w-10",
  markCut = false,
  sku,
}: {
  className?: string
  markCut?: boolean
  sku?: Sku
}) {
  const { i18n, t } = useTranslation("app")
  const src = getSkuImageUrl(sku)
  const name = getLocalizedSkuName(sku, i18n.language)

  if (markCut && isCutProduct(sku)) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-sm bg-inverse p-1 text-center text-xs/tight font-bold whitespace-pre-line text-inverse",
          className
        )}
      >
        {t("cutProductStockExcluded")}
      </span>
    )
  }

  if (src) {
    return (
      <img
        alt={name || "product"}
        className={cn("object-contain", className)}
        draggable={false}
        loading="lazy"
        src={src}
      />
    )
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-sm bg-subtle text-center text-xs font-bold text-secondary",
        className
      )}
    >
      {name ? name.slice(0, 2) : "-"}
    </span>
  )
}
