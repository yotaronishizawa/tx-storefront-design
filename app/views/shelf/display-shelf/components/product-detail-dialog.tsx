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

  return (
    <Dialog.Popup
      open={Boolean(cell && sku)}
      onClose={onClose}
      closeLabel={t("common:actions.close")}
      title={getLocalizedSkuName(sku, i18n.language)}
      layer="base"
      actions={
        <Dialog.Actions>
          <Button size="lg" onClick={onClose}>
            {t("common:actions.close")}
          </Button>
        </Dialog.Actions>
      }
    >
      <div className="mx-auto grid size-44 shrink-0 place-items-center rounded-md bg-subtle">
        <ProductThumb className="h-36 w-24" markCut sku={sku} />
      </div>
      <p className="text-center text-secondary">{getSkuVolume(sku)}</p>
    </Dialog.Popup>
  )
}
