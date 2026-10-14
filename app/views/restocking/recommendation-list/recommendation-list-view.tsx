import { useEffect, useMemo, useState } from "react"

import {
  LoaderCircle,
  Plus,
  RotateCw,
  Search,
  TriangleAlert,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import type { Sku, SkuRecommendationCounts } from "~/api/opm/schemas"
import { ConfirmDialog } from "~/components/dialog/confirm-dialog"
import { MessageDialog } from "~/components/dialog/message-dialog"
import { PanelTitle } from "~/components/layout/panel-title"
import { ProductSearchDialog } from "~/components/product/product-search-dialog"
import { FEATURES } from "~/config/feature"
import { Button, Input, Toast } from "~/core"
import {
  clampRecommendationCount,
  MAX_RECOMMENDATION_COUNT,
  recommendationSignature,
} from "~/model/shelf"
import { getSkuName, matchesSkuSearch } from "~/model/sku"
import type { BusyAction } from "~/types/busy-action"

import {
  RecommendationListRow,
  type RecommendationEntry,
} from "./components/recommendation-list-row"

const COUNT_CLAMPED_TOAST_ID = "recommendation-count-clamped"
const COUNT_CLAMPED_TOAST_MS = 5000

export function RecommendationListView({
  busyAction,
  loading,
  readFailed,
  recommendations,
  skuById,
  skus,
  onReloadRecommendations,
  onSaveRecommendations,
}: {
  busyAction: BusyAction
  /** The list is being read, so what is shown may not be OPM's. */
  loading: boolean
  readFailed: boolean
  recommendations: SkuRecommendationCounts
  skuById: Map<string, Sku>
  skus: Sku[]
  onReloadRecommendations: () => Promise<void>
  onSaveRecommendations: (
    recommendations: SkuRecommendationCounts
  ) => Promise<boolean>
}) {
  const { i18n, t } = useTranslation(["app", "common"])
  const productEntity = t("common:entity.product", { count: 1 })

  // SKUs missing from the catalogue are left out, so a save drops them, as in the store app.
  const savedRows = useMemo(
    () => countsToRows(recommendations, skuById),
    [recommendations, skuById]
  )
  const [rows, setRows] = useState<RecommendationEntry[]>(savedRows)
  const [search, setSearch] = useState("")
  const [productSearch, setProductSearch] = useState("")
  const [feedback, setFeedback] = useState("")
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false)
  const [productPickerOpen, setProductPickerOpen] = useState(false)
  const saving = busyAction === "save-recommendations"
  const reloading = busyAction === "load-recommendations"
  // Saving replaces OPM's whole list, so nothing is editable until it and the catalogue are read.
  const locked = loading || readFailed || skus.length === 0
  const savedSignature = useMemo(
    () => recommendationSignature(rowsToCounts(savedRows)),
    [savedRows]
  )
  const currentRecommendations = useMemo(() => rowsToCounts(rows), [rows])
  const currentSignature = useMemo(
    () => recommendationSignature(currentRecommendations),
    [currentRecommendations]
  )
  const dirty = currentSignature !== savedSignature
  const existingSkuIds = useMemo(
    () => new Set(rows.map((row) => row.skuId)),
    [rows]
  )
  const filteredRows = useMemo(() => {
    if (!search.trim()) {
      return rows
    }

    return rows.filter((row) =>
      matchesSkuSearch(skuById.get(row.skuId), search, i18n.language, row.skuId)
    )
  }, [i18n.language, rows, search, skuById])

  useEffect(() => {
    setRows(savedRows)
  }, [savedRows])

  async function saveRecommendations() {
    const didSave = await onSaveRecommendations(currentRecommendations)
    setSaveConfirmOpen(false)
    if (didSave) {
      setRows((current) =>
        current.slice().sort((left, right) => right.count - left.count)
      )
    }
  }

  function addRecommendation(skuId: string) {
    if (existingSkuIds.has(skuId)) {
      setFeedback(t("recommendationProductAlreadyExists"))
      return
    }

    setRows((current) => [
      { skuId, count: FEATURES.newRecommendationCount },
      ...current,
    ])
    setProductPickerOpen(false)
    setProductSearch("")
    // Clear the filter so the new row shows at the top.
    setSearch("")
  }

  function removeRecommendation(skuId: string) {
    setRows((current) => current.filter((row) => row.skuId !== skuId))
  }

  // A typed 0 or less keeps the previous count.
  function updateCount(skuId: string, count: number) {
    if (count < 1) {
      return
    }
    if (count > MAX_RECOMMENDATION_COUNT) {
      Toast.notify.warning(
        t("recommendationCountClamped", { max: MAX_RECOMMENDATION_COUNT }),
        { duration: COUNT_CLAMPED_TOAST_MS, key: COUNT_CLAMPED_TOAST_ID }
      )
    }

    const nextCount = clampRecommendationCount(count)
    setRows((current) =>
      current.map((row) =>
        row.skuId === skuId ? { ...row, count: nextCount } : row
      )
    )
  }

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="mb-5 min-w-0 shrink-0">
        <PanelTitle title={t("recommendationListTitle")} />
        <p className="mt-1 text-sm font-bold text-secondary">
          {t("common:count.item", { count: rows.length })}
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-lg border bg-default p-4">
        <div className="grid shrink-0 grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
          <label className="flex h-14 min-w-0 items-center gap-3 rounded-md border border-strong bg-default px-4 focus-within:ring-2 focus-within:ring-primary">
            <Search className="size-6 shrink-0 text-secondary" />
            <span className="sr-only">
              {t("common:search.labelWithEntity", { entity: productEntity })}
            </span>
            <Input
              className="h-full flex-1 text-base font-bold text-primary"
              placeholder={t("common:search.placeholderWithEntity", {
                entity: productEntity,
              })}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <Button
            size="lg"
            disabled={locked}
            icon={<Plus />}
            type="button"
            onClick={() => setProductPickerOpen(true)}
          >
            {t("newRegistration")}
          </Button>

          <Button
            size="lg"
            className="px-8"
            busy={saving}
            disabled={!dirty || locked}
            type="button"
            onClick={() => setSaveConfirmOpen(true)}
          >
            {t("common:actions.save")}
          </Button>
        </div>

        {readFailed && !loading && (
          <div
            className="mt-4 flex shrink-0 items-center gap-3 rounded-lg border-2 border-error bg-error-subtle p-4"
            role="alert"
          >
            <TriangleAlert className="size-6 shrink-0 text-error" />
            <p className="min-w-0 flex-1 text-base/snug font-bold text-primary">
              {t("recommendationListLoadFailed")}
            </p>
            <Button
              variant="secondary"
              size="lg"
              busy={reloading}
              icon={<RotateCw />}
              type="button"
              onClick={() => void onReloadRecommendations()}
            >
              {t("common:actions.retry")}
            </Button>
          </div>
        )}

        <div className="mt-4 min-h-0 flex-1 overflow-auto rounded-lg border border-default bg-subtle p-3">
          {loading && (
            <p
              className="flex items-center justify-center gap-3 py-12 text-base font-bold text-secondary"
              role="status"
            >
              <LoaderCircle className="size-6 animate-spin" />
              {t("recommendationListLoading")}
            </p>
          )}

          <div className="grid gap-2">
            {filteredRows.map((row) => (
              <RecommendationListRow
                disabled={locked}
                key={row.skuId}
                row={row}
                sku={skuById.get(row.skuId)}
                onCountChange={updateCount}
                onRemove={removeRecommendation}
              />
            ))}
          </div>

          {rows.length === 0 && !locked && (
            <p className="py-12 text-center text-base font-bold text-secondary">
              {t("recommendationListEmpty")}
            </p>
          )}

          {rows.length > 0 && filteredRows.length === 0 && (
            <p className="py-12 text-center text-base font-bold text-secondary">
              {t("common:table.noResults")}
            </p>
          )}
        </div>
      </div>

      <ProductSearchDialog
        existingSkuIds={existingSkuIds}
        open={productPickerOpen}
        search={productSearch}
        skus={skus}
        onCancel={() => {
          setProductPickerOpen(false)
          setProductSearch("")
        }}
        onSearchChange={setProductSearch}
        onSelect={addRecommendation}
      />
      <ConfirmDialog
        busy={saving}
        cancelLabel={t("common:boolean.no")}
        confirmLabel={t("common:boolean.yes")}
        message={t("recommendationListConfirmSave")}
        open={saveConfirmOpen}
        onCancel={() => setSaveConfirmOpen(false)}
        onConfirm={() => {
          void saveRecommendations()
        }}
      />
      <MessageDialog
        message={feedback}
        okLabel={t("common:actions.ok")}
        open={Boolean(feedback)}
        onClose={() => setFeedback("")}
      />
    </section>
  )
}

function countsToRows(
  recommendations: SkuRecommendationCounts,
  skuById: Map<string, Sku>
): RecommendationEntry[] {
  return Object.entries(recommendations)
    .map(([skuId, count]) => ({
      count: clampRecommendationCount(count),
      skuId,
    }))
    .filter((row) => skuById.has(row.skuId))
    .sort((left, right) =>
      getSkuName(skuById.get(left.skuId)).localeCompare(
        getSkuName(skuById.get(right.skuId)),
        "ja"
      )
    )
}

function rowsToCounts(rows: RecommendationEntry[]): SkuRecommendationCounts {
  return Object.fromEntries(
    rows.map((row) => [row.skuId, clampRecommendationCount(row.count)])
  )
}
