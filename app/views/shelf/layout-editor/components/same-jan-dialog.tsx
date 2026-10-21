import { useRef } from "react"

import { useTranslation } from "react-i18next"

import type { Sku } from "~/api/opm/schemas"
import { ProductThumb } from "~/components/product/product-thumb"
import { Button, Dialog } from "~/core"
import { getLocalizedSkuName } from "~/model/sku"

export function SameJanDialog({
  existingSku,
  nextSku,
  open,
  onNo,
  onYes,
}: {
  existingSku?: Sku
  nextSku?: Sku
  open: boolean
  onNo: () => void
  onYes: () => void
}) {
  const { i18n, t } = useTranslation(["app", "common"])
  const noRef = useRef<HTMLButtonElement>(null)

  return (
    <Dialog.Popup
      open={open}
      onClose={onNo}
      closeLabel={t("common:actions.close")}
      initialFocus={noRef}
      layer="top"
      role="alertdialog"
      actions={
        <Dialog.Actions>
          {/* Main action on the left, as in every popup; focus still starts on No. */}
          <Button size="lg" onClick={onYes}>
            {t("common:boolean.yes")}
          </Button>
          <Button ref={noRef} size="lg" variant="secondary" onClick={onNo}>
            {t("common:boolean.no")}
          </Button>
        </Dialog.Actions>
      }
    >
      <p className="whitespace-pre-line">
        {t("layoutSameJanPrompt", {
          existing: getLocalizedSkuName(existingSku, i18n.language),
          next: getLocalizedSkuName(nextSku, i18n.language),
        })}
      </p>
      <div className="mx-auto grid w-full max-w-115 grid-cols-[1fr_auto_1fr] items-center gap-8">
        <ProductChangePreview sku={existingSku} />
        <span className="text-display-lg font-bold">→</span>
        <ProductChangePreview sku={nextSku} />
      </div>
    </Dialog.Popup>
  )
}

function ProductChangePreview({ sku }: { sku?: Sku }) {
  const { i18n } = useTranslation()

  return (
    <div className="grid justify-items-center gap-3 text-center">
      <ProductThumb className="h-28 w-20" sku={sku} />
      <p className="line-clamp-2 text-base">
        {getLocalizedSkuName(sku, i18n.language)}
      </p>
    </div>
  )
}
