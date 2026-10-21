import { useMemo, useRef } from "react"

import { useTranslation } from "react-i18next"

import type { Sku } from "~/api/opm/schemas"
import { Button, Dialog, SearchField } from "~/core"
import { useRevealOnScroll } from "~/hooks/use-reveal-on-scroll"
import { getLocalizedSkuName, isUsableSku, matchesSkuSearch } from "~/model/sku"

import { ProductThumb } from "./product-thumb"

const PRODUCT_PICKER_PAGE_SIZE = 48
const NO_SKU_IDS: ReadonlySet<string> = new Set()

/** Picks one usable SKU from `skus`; those in `existingSkuIds` are left out. */
export function ProductSearchDialog({
  existingSkuIds = NO_SKU_IDS,
  open,
  search,
  skus,
  onCancel,
  onSearchChange,
  onSelect,
}: {
  existingSkuIds?: ReadonlySet<string>
  open: boolean
  search: string
  skus: Sku[]
  onCancel: () => void
  onSearchChange: (search: string) => void
  onSelect: (skuId: string) => void
}) {
  const { i18n, t } = useTranslation(["app", "common"])
  const productEntity = t("common:entity.product", { count: 1 })
  const searchLabel = t("common:search.labelWithEntity", {
    entity: productEntity,
  })

  const availableSkus = useMemo(
    () =>
      skus
        .filter((sku) => isUsableSku(sku) && !existingSkuIds.has(sku.id))
        .filter((sku) => matchesSkuSearch(sku, search, i18n.language)),
    [existingSkuIds, i18n.language, search, skus]
  )
  const {
    visible: visibleSkus,
    hasMore,
    setSentinel,
  } = useRevealOnScroll(availableSkus, PRODUCT_PICKER_PAGE_SIZE)

  const searchRef = useRef<HTMLInputElement>(null)

  return (
    <Dialog.Popup
      open={open}
      onClose={onCancel}
      closeLabel={t("common:actions.close")}
      title={searchLabel}
      size="wide"
      initialFocus={searchRef}
      layer="base"
      actions={
        <Dialog.Actions>
          <Button size="lg" variant="secondary" onClick={onCancel}>
            {t("common:actions.cancel")}
          </Button>
        </Dialog.Actions>
      }
    >
      <div className="shrink-0">
        <SearchField
          inputRef={searchRef}
          clearLabel={t("common:actions.clear")}
          placeholder={t("common:search.placeholderWithEntity", {
            entity: productEntity,
          })}
          value={search}
          onValueChange={onSearchChange}
        />
      </div>

      {visibleSkus.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {visibleSkus.map((sku) => (
            <Button
              variant="unstyled"
              size="unstyled"
              key={sku.id}
              className="flex min-h-44 flex-col items-center justify-start gap-3 rounded-lg border-2 border-control bg-default p-3 text-center whitespace-normal transition active:bg-subtle"
              type="button"
              onClick={() => onSelect(sku.id)}
            >
              <ProductThumb className="h-24 w-16 shrink-0" markCut sku={sku} />
              <span className="line-clamp-3 text-xs/snug font-bold text-primary">
                {getLocalizedSkuName(sku, i18n.language)}
              </span>
            </Button>
          ))}
          {hasMore && (
            <div aria-hidden className="col-span-full h-1" ref={setSentinel} />
          )}
        </div>
      ) : (
        <p className="grid min-h-56 shrink-0 place-items-center text-secondary">
          {t("common:table.noResults")}
        </p>
      )}
    </Dialog.Popup>
  )
}
