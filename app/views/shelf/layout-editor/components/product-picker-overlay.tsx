import { useRef } from "react"

import { ScanBarcode, Search } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { Sku } from "~/api/opm/schemas"
import { ProductThumb } from "~/components/product/product-thumb"
import { Button, Dialog, Input } from "~/core"
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
    <Dialog.Root
      className="flex max-h-[88dvh] w-full max-w-dialog-lg flex-col gap-4 p-6"
      initialFocus={cancelRef}
      open={open}
      onDismiss={onClose}
    >
      <div className="mb-3 flex items-center gap-3">
        <Dialog.Title className="text-xl">
          {t(
            insertTarget
              ? "workflow.layout.pickerInsertTitle"
              : "workflow.layout.pickerTitle"
          )}
        </Dialog.Title>
        <Button
          ref={cancelRef}
          className="ml-auto"
          variant="secondary"
          type="button"
          onClick={onClose}
        >
          {t("common:actions.cancel")}
        </Button>
      </div>
      <p className="text-base font-bold">
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
      <p className="flex items-center gap-2 text-base font-bold">
        <ScanBarcode className="size-6" />
        {t("workflow.layout.scanInstruction")}
      </p>
      <div className="flex h-14 shrink-0 items-center gap-2 rounded-md border border-strong bg-default px-3">
        <Search className="size-4 text-secondary" />
        <Input
          aria-label={t("common:search.labelWithEntity", {
            entity: t("common:entity.product", { count: 1 }),
          })}
          className="flex-1 text-base"
          placeholder={t("common:search.placeholderWithEntity", {
            entity: t("common:entity.product", { count: 1 }),
          })}
          value={search}
          onChange={(event) => onSearch(event.target.value)}
        />
      </div>

      {filteredSkus.length > 0 ? (
        <div className="min-h-0 overflow-auto rounded-md bg-subtle p-3">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(128px,1fr))] gap-3">
            {visible.map((sku) => (
              <Button
                variant="unstyled"
                size="unstyled"
                key={sku.id}
                className="flex min-h-45 flex-col items-center rounded-lg border bg-default p-3 text-center transition active:bg-muted"
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
              <div
                aria-hidden
                className="col-span-full h-1"
                ref={setSentinel}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="grid min-h-64 place-items-center rounded-md bg-muted text-base font-bold text-secondary">
          {t("common:table.noResults")}
        </div>
      )}
    </Dialog.Root>
  )
}
