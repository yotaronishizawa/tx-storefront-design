import { useState } from "react"

import { Info, Trash2, X } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { Sku } from "~/api/opm/schemas"
import { ConfirmDialog } from "~/components/dialog/confirm-dialog"
import { ProductThumb } from "~/components/product/product-thumb"
import { REMOVAL_BLOCK_MESSAGE_KEYS } from "~/components/shelf/lane-detail/removal-block-message"
import { Button } from "~/core"
import type { StockRemovalBlock } from "~/model/robot-status"
import { getLocalizedSkuName, getSkuVolume } from "~/model/sku"

/** The drink the operator looked up; the board badges each lane holding it. */
export function SkuRemovalPanel({
  canRemoveAll,
  count,
  removalBlock,
  removing,
  sku,
  skuId,
  onCancel,
  onRemoveAll,
}: {
  canRemoveAll: boolean
  count: number
  removalBlock: StockRemovalBlock
  removing: boolean
  sku?: Sku
  skuId: string
  onCancel: () => void
  onRemoveAll: () => void
}) {
  const { i18n, t } = useTranslation(["app", "common"])
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <section
      aria-live="polite"
      className="overflow-hidden rounded-lg border-2 border-error bg-default"
    >
      <div className="grid grid-cols-[32px_minmax(0,1fr)] items-center gap-2 p-2">
        <ProductThumb className="h-16 w-8" sku={sku} />
        <div className="min-w-0">
          <p className="truncate text-xs/tight font-bold">
            {getLocalizedSkuName(sku, i18n.language) || skuId}
            <span className="ml-1 font-normal text-secondary">
              {getSkuVolume(sku)}
            </span>
          </p>
          <p className="mt-1 text-base/tight font-bold text-error">
            {t("skuRemovalStockCount", { count })}
          </p>
        </div>
      </div>

      {canRemoveAll && removalBlock && (
        // Inline, not a tooltip: there is no hover on a touch tablet.
        <p
          className="mx-2 mb-2 flex items-center gap-2 rounded-sm bg-warning-subtle p-2 text-xs font-bold text-primary"
          role="status"
        >
          <Info className="size-4 shrink-0" />
          {t(REMOVAL_BLOCK_MESSAGE_KEYS[removalBlock])}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 border-t border-default p-2">
        <Button
          className={canRemoveAll ? undefined : "col-span-2"}
          disabled={removing}
          icon={<X />}
          size="sm"
          type="button"
          variant="secondary"
          onClick={onCancel}
        >
          {t("skuRemovalDone")}
        </Button>
        {canRemoveAll && (
          <Button
            busy={removing}
            disabled={Boolean(removalBlock) || count === 0}
            icon={<Trash2 />}
            size="sm"
            type="button"
            onClick={() => setConfirmOpen(true)}
          >
            {t("skuRemovalRemoveAll")}
          </Button>
        )}
      </div>

      <ConfirmDialog
        cancelLabel={t("common:actions.cancel")}
        confirmLabel={t("skuRemovalRemoveAll")}
        message={t("skuRemovalConfirm")}
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false)
          onRemoveAll()
        }}
      />
    </section>
  )
}
