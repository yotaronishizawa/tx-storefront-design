import { MousePointer2, ScanBarcode, Trash2, X } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { Sku } from "~/api/opm/schemas"
import { ProductThumb } from "~/components/product/product-thumb"
import { Button } from "~/core"
import type { LayoutCabinet } from "~/model/shelf"
import { getLocationSkuId } from "~/model/shelf"
import { getLocalizedSkuName } from "~/model/sku"

export function LayoutSelectionBar({
  board,
  selectedIds,
  skuById,
  onClear,
  onReplace,
  onRemove,
  canEditLanes = false,
}: {
  board: LayoutCabinet[]
  selectedIds: string[]
  skuById: Map<string, Sku>
  onClear: () => void
  onReplace: () => void
  onRemove: () => void
  canEditLanes?: boolean
}) {
  const { i18n, t } = useTranslation("app")
  const selected = board
    .flatMap((cabinet) => cabinet.rows.flatMap((row) => row.cells))
    .filter((cell) => selectedIds.includes(cell.id))
  const first = selected[0]
  const sku = first?.location
    ? skuById.get(getLocationSkuId(first.location))
    : undefined
  if (!first)
    return (
      <div className="flex min-h-20 shrink-0 items-center gap-3 rounded-lg border border-default bg-default px-4 py-3">
        <MousePointer2 className="size-6 text-secondary" />
        <p className="text-lg font-bold text-primary">
          {t("workflow.layout.selectInstruction")}
        </p>
      </div>
    )
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-3 rounded-lg border-2 border-primary bg-primary-subtle px-4 py-3">
      <ProductThumb className="h-14 w-10" sku={sku} />
      <div className="min-w-40 flex-1">
        <p className="text-sm font-bold text-secondary">
          {t("workflow.layout.faceLocation", {
            cabinet: first.cabinet,
            row: first.row + 1,
            face: first.column,
          })}
          {selected.length > 1 &&
            ` · ${t("workflow.layout.selectedCount", { count: selected.length })}`}
        </p>
        <p className="line-clamp-1 text-xl font-bold">
          {getLocalizedSkuName(sku, i18n.language)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-full sm:w-auto">
          <p className="mb-2 flex items-center gap-2 text-lg font-bold">
            <ScanBarcode className="size-6" />
            {t("workflow.layout.scanInstruction")}
          </p>
          <Button className="w-full" onClick={onReplace}>
            {t("workflow.layout.searchAlternative")}
          </Button>
        </div>
        {canEditLanes && (
          <Button
            aria-label={t("workflow.layout.removeSelected")}
            className="w-12 px-0 sm:w-auto sm:px-4"
            icon={<Trash2 />}
            variant="secondary"
            onClick={onRemove}
          >
            <span className="hidden sm:inline">
              {t("workflow.layout.remove")}
            </span>
          </Button>
        )}
        <Button
          aria-label={t("workflow.layout.clearSelection")}
          className="w-12 px-0"
          icon={<X />}
          variant="secondary"
          onClick={onClear}
        />
      </div>
    </div>
  )
}
