import { PackagePlus } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { Sku } from "~/api/opm/schemas"
import { ProductThumb } from "~/components/product/product-thumb"
import { Button } from "~/core"
import type { LayoutCell } from "~/model/shelf"
import { getLocalizedSkuName, getSkuVolume } from "~/model/sku"

export function SelectedLaneCard({
  cell,
  cutProduct,
  reserving,
  sku,
  onOpenDetail,
  onReserve,
}: {
  cell?: LayoutCell | null
  /** Labelled as cut; reserving it is refused with the reason. */
  cutProduct: boolean
  reserving: boolean
  sku?: Sku
  onOpenDetail: (cell: LayoutCell) => void
  onReserve: () => void
}) {
  const { i18n, t } = useTranslation(["app", "common"])

  if (!cell || !sku) {
    return (
      <div className="rounded-lg border bg-default px-4 py-8 text-center text-xs/relaxed font-bold text-secondary">
        {t("displayNoSelectedProduct")}
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      <Button
        variant="unstyled"
        size="unstyled"
        className="grid w-full place-items-center rounded-lg border-2 border-primary bg-primary-subtle p-3 text-center"
        type="button"
        onClick={() => onOpenDetail(cell)}
      >
        <span className="mb-2 min-w-16 rounded-full bg-muted px-4 py-1 text-lg font-bold">
          {cell.column}
        </span>
        <ProductThumb className="h-24 w-16" sku={sku} />
        <span className="mt-2 line-clamp-2 text-lg/tight font-bold">
          {getLocalizedSkuName(sku, i18n.language)}
        </span>
        <span className="mt-1 text-sm font-bold text-secondary">
          {getSkuVolume(sku)}
        </span>
        {cutProduct && (
          <span className="mt-2 text-base font-bold">
            {t("cutProductStockExcluded")}
          </span>
        )}
      </Button>

      <Button
        type="button"
        onClick={onReserve}
        size="md"
        busy={reserving}
        icon={<PackagePlus />}
      >
        {t("displayReservation")}
      </Button>
    </div>
  )
}
