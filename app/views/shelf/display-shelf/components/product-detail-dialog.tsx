import { useId } from "react"

import { useTranslation } from "react-i18next"

import type { Sku } from "~/api/opm/schemas"
import { ProductThumb } from "~/components/product/product-thumb"
import { Button, Dialog } from "~/core"
import type { LayoutCell } from "~/model/shelf"
import { getLocalizedSkuName, getSkuVolume } from "~/model/sku"

export function ProductDetailDialog({
  cell,
  sku,
  onClose,
}: {
  cell: LayoutCell | null
  sku?: Sku
  onClose: () => void
}) {
  const { i18n, t } = useTranslation(["app", "common"])
  const titleId = useId()

  return (
    <Dialog.Root
      className="grid min-h-80 max-w-dialog-sm grid-rows-[1fr_auto] p-8 text-center"
      labelledById={titleId}
      layer="base"
      open={Boolean(cell && sku)}
      onDismiss={onClose}
    >
      <div className="self-center">
        <h3 id={titleId} className="mb-5 text-base font-bold">
          {getLocalizedSkuName(sku, i18n.language)}
        </h3>
        <div className="mx-auto grid size-44 place-items-center rounded-md bg-subtle">
          <ProductThumb className="h-36 w-24" markCut sku={sku} />
        </div>
        <p className="mt-3 text-sm font-bold text-secondary">
          {getSkuVolume(sku)}
        </p>
      </div>

      <Button className="mx-auto" size="sm" onClick={onClose}>
        {t("common:actions.close")}
      </Button>
    </Dialog.Root>
  )
}
