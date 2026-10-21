import { useRef } from "react"

import { ScanBarcode } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { Sku } from "~/api/opm/schemas"
import { ProductThumb } from "~/components/product/product-thumb"
import { Button, Dialog, SearchField } from "~/core"
import { useRevealOnScroll } from "~/hooks/use-reveal-on-scroll"
import type { LayoutCell } from "~/model/shelf"
import { getLocalizedSkuName, getSkuVolume } from "~/model/sku"

const PICKER_PAGE_SIZE = 48

export function ProductPickerOverlay({
  filteredSkus,
  selectedCells,
  insertTarget,
  open,
  search,
  onClose,
  onSearch,
  onSelectSku,
}: {
  filteredSkus: Sku[]
  selectedCells: LayoutCell[]
  insertTarget: { cabinet: number; row: number } | null
  open: boolean
  search: string
  onClose: () => void
  onSearch: (value: string) => void
  onSelectSku: (skuId: string) => void
}) {
  const { i18n, t } = useTranslation(["app", "common"])
  const cancelRef = useRef<HTMLButtonElement>(null)
  const first = selectedCells[0]
  const { visible, hasMore, setSentinel } = useRevealOnScroll(
    filteredSkus,
    PICKER_PAGE_SIZE
  )

  if (!open) {
    return null
  }

  return (
    <Dialog.Popup
      open={open}
      onClose={onClose}
      closeLabel={t("common:actions.close")}
      title={t(
        insertTarget
          ? "workflow.layout.pickerInsertTitle"
          : "workflow.layout.pickerTitle"
      )}
      size="wide"
      initialFocus={cancelRef}
      actions={
        <Dialog.Actions>
          <Button
            ref={cancelRef}
            size="lg"
            variant="secondary"
            type="button"
            onClick={onClose}
          >
            {t("common:actions.cancel")}
          </Button>
        </Dialog.Actions>
      }
    >
      <p className="font-bold">
        {insertTarget
          ? t("workflow.layout.addFaceInRow", { row: insertTarget.row + 1 })
          : first
            ? t("workflow.layout.faceLocation", {
                cabinet: first.cabinet,
                row: first.row + 1,
                face: first.column,
              })
            : ""}
        {selectedCells.length > 1 &&
          ` · ${t("workflow.layout.selectedCount", { count: selectedCells.length })}`}
      </p>
      <p className="flex items-center gap-2">
        <ScanBarcode aria-hidden className="size-6 shrink-0" />
        {t("workflow.layout.scanInstruction")}
      </p>
      <SearchField
        className="shrink-0"
        clearLabel={t("common:actions.clear")}
        placeholder={t("common:search.placeholderWithEntity", {
          entity: t("common:entity.product", { count: 1 }),
        })}
        value={search}
        onValueChange={onSearch}
      />

      {filteredSkus.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(128px,1fr))] gap-3">
          {visible.map((sku) => (
            <Button
              variant="unstyled"
              size="unstyled"
              key={sku.id}
              className="flex min-h-45 flex-col items-center rounded-lg border-2 border-control bg-default p-3 text-center whitespace-normal transition active:bg-subtle"
              type="button"
              onClick={() => onSelectSku(sku.id)}
            >
              <ProductThumb className="h-24 w-16" sku={sku} />
              <span className="mt-2 line-clamp-3 text-xs/tight font-bold">
                {getLocalizedSkuName(sku, i18n.language)}
              </span>
              <span className="mt-auto text-xs font-bold text-secondary">
                {getSkuVolume(sku) || sku.id}
              </span>
            </Button>
          ))}
          {hasMore && (
            <div aria-hidden className="col-span-full h-1" ref={setSentinel} />
          )}
        </div>
      ) : (
        <div className="grid min-h-64 shrink-0 place-items-center rounded-md bg-muted text-secondary">
          {t("common:table.noResults")}
        </div>
      )}
    </Dialog.Popup>
  )
}
