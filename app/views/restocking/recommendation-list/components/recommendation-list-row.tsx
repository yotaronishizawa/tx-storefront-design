import { Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { Sku } from "~/api/opm/schemas"
import { ProductThumb } from "~/components/product/product-thumb"
import { Button, NumberField } from "~/core"
import { MAX_RECOMMENDATION_COUNT } from "~/model/shelf"
import { getLocalizedSkuName, getSkuVolume } from "~/model/sku"

export type RecommendationEntry = {
  count: number
  skuId: string
}

export function RecommendationListRow({
  disabled,
  row,
  sku,
  onCountChange,
  onRemove,
}: {
  disabled: boolean
  row: RecommendationEntry
  sku?: Sku
  /** Gets the typed count unclamped, so the caller can warn about it. */
  onCountChange: (skuId: string, count: number) => void
  onRemove: (skuId: string) => void
}) {
  const { i18n, t } = useTranslation(["app", "common"])

  const name = getLocalizedSkuName(sku, i18n.language) || row.skuId
  const volume = getSkuVolume(sku)

  return (
    <article className="grid min-h-24 grid-cols-[76px_minmax(0,1fr)_112px_56px] items-center gap-4 rounded-md border border-default bg-default px-4 py-3">
      <div className="flex h-20 items-center justify-center rounded-sm bg-subtle">
        <ProductThumb className="h-18 w-12 shrink-0" markCut sku={sku} />
      </div>

      <div className="min-w-0">
        <h3 className="line-clamp-2 text-base/snug font-bold text-primary">
          {name}
        </h3>
        <p className="mt-1 truncate text-xs font-bold text-secondary">
          {volume ? `${volume} / ` : ""}
          {row.skuId}
        </p>
      </div>

      <label className="min-w-0">
        <span className="sr-only">{t("neededStockCount")}</span>
        <NumberField.Root
          allowOutOfRange
          className="w-full"
          disabled={disabled}
          inputClassName="h-12 w-full rounded-md border border-strong bg-subtle text-center text-xl font-bold text-primary focus:ring-2 focus:ring-primary disabled:text-disabled"
          max={MAX_RECOMMENDATION_COUNT}
          min={1}
          value={row.count}
          onValueChange={(next) => onCountChange(row.skuId, next)}
        />
      </label>

      <Button
        variant="unstyled"
        size="unstyled"
        aria-label={t("common:actions.removeWithEntity", {
          entity: t("common:entity.product", { count: 1 }),
        })}
        className="grid size-12 place-items-center rounded-md border border-strong bg-default text-primary transition active:bg-muted disabled:cursor-not-allowed disabled:text-disabled [&_svg]:size-6"
        disabled={disabled}
        type="button"
        onClick={() => onRemove(row.skuId)}
      >
        <Trash2 />
      </Button>
    </article>
  )
}
