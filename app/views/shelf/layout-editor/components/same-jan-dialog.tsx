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
    <Dialog.Root
      className="grid min-h-90 max-w-dialog-lg grid-rows-[1fr_auto] p-8 text-center"
      initialFocus={noRef}
      layer="top"
      open={open}
      role="alertdialog"
      onDismiss={onNo}
    >
      <div className="self-center">
        <div className="mx-auto grid max-w-115 grid-cols-[1fr_auto_1fr] items-center gap-8">
          <ProductChangePreview sku={existingSku} />
          <span className="text-display-lg font-bold">→</span>
          <ProductChangePreview sku={nextSku} />
        </div>
        <Dialog.Message className="mt-8">
          {t("layoutSameJanPrompt", {
            existing: getLocalizedSkuName(existingSku, i18n.language),
            next: getLocalizedSkuName(nextSku, i18n.language),
          })}
        </Dialog.Message>
      </div>

      <Dialog.Footer className="max-w-dialog-sm">
        {/* Main action on the left, as in every popup; focus still starts on No. */}
        <Button size="sm" onClick={onYes}>
          {t("common:boolean.yes")}
        </Button>
        <Button ref={noRef} size="sm" variant="secondary" onClick={onNo}>
          {t("common:boolean.no")}
        </Button>
      </Dialog.Footer>
    </Dialog.Root>
  )
}

function ProductChangePreview({ sku }: { sku?: Sku }) {
  const { i18n } = useTranslation()

  return (
    <div className="grid justify-items-center gap-3">
      <ProductThumb className="h-28 w-20" sku={sku} />
      <p className="line-clamp-2 text-xs font-bold">
        {getLocalizedSkuName(sku, i18n.language)}
      </p>
    </div>
  )
}
