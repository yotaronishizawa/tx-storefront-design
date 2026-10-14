import { useId, useMemo, useRef } from "react"

import { Search } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { Sku } from "~/api/opm/schemas"
import { Button, Dialog, Input } from "~/core"
import { useRevealOnScroll } from "~/hooks/use-reveal-on-scroll"
import { getLocalizedSkuName, isUsableSku, matchesSkuSearch } from "~/model/sku"

import { PanelTitle } from "../layout/panel-title"
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

  const titleId = useId()
  const searchRef = useRef<HTMLInputElement>(null)

  return (
    <Dialog.Root
      className="flex max-h-[88vh] min-h-115 max-w-dialog-xl flex-col p-6"
      initialFocus={searchRef}
      labelledById={titleId}
      layer="base"
      open={open}
      onDismiss={onCancel}
    >
      <PanelTitle id={titleId} title={searchLabel} />

      <label className="mt-6 flex h-14 shrink-0 items-center gap-3 rounded-md border-2 border-strong bg-default px-4 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary">
        <Search className="size-6 shrink-0 text-secondary" />
        <span className="sr-only">{searchLabel}</span>
        <Input
          className="h-full flex-1 text-base font-bold text-primary"
          ref={searchRef}
          placeholder={t("common:search.placeholderWithEntity", {
            entity: productEntity,
          })}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>

      <Dialog.Content className="flex-1 p-4">
        {visibleSkus.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {visibleSkus.map((sku) => (
              <Button
                variant="unstyled"
                size="unstyled"
                key={sku.id}
                className="flex min-h-44 flex-col items-center justify-start gap-3 rounded-md border bg-default p-3 text-center transition active:border-primary active:bg-primary-subtle"
                type="button"
                onClick={() => onSelect(sku.id)}
              >
                <ProductThumb
                  className="h-24 w-16 shrink-0"
                  markCut
                  sku={sku}
                />
                <span className="line-clamp-3 text-xs/snug font-bold text-primary">
                  {getLocalizedSkuName(sku, i18n.language)}
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
        ) : (
          <p className="grid min-h-56 place-items-center text-base font-bold text-secondary">
            {t("common:table.noResults")}
          </p>
        )}
      </Dialog.Content>

      <Button className="mx-auto mt-5 min-w-32" size="sm" onClick={onCancel}>
        {t("common:actions.cancel")}
      </Button>
    </Dialog.Root>
  )
}
