import { Loader2, RotateCw, TriangleAlert } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "~/core"
import type { RecommendationRow } from "~/model/shelf"

import { RecommendationRowCard } from "./restocking-recommendation-row"

export function RecommendationTableBody({
  highlightedSkuId,
  loading,
  readFailed,
  reloading,
  rows,
  onReload,
}: {
  highlightedSkuId: string
  loading: boolean
  readFailed: boolean
  reloading: boolean
  rows: RecommendationRow[]
  onReload: () => void
}) {
  const { t } = useTranslation(["app", "common"])

  if (readFailed) {
    return (
      <div
        className="grid min-h-56 place-items-center content-center gap-3 p-3 text-center"
        role="alert"
      >
        <TriangleAlert className="size-7 text-error" />
        <p className="text-sm/snug font-bold text-primary">
          {t("recommendationListUnavailable")}
        </p>
        <Button
          variant="secondary"
          busy={reloading}
          icon={<RotateCw />}
          type="button"
          onClick={onReload}
        >
          {t("common:actions.retry")}
        </Button>
      </div>
    )
  }

  // A re-read keeps the rows already shown.
  if (rows.length === 0 && loading) {
    return (
      <p
        className="flex min-h-56 items-center justify-center gap-3 text-sm font-bold text-secondary"
        role="status"
      >
        <Loader2 className="size-6 animate-spin" />
        {t("recommendationListLoading")}
      </p>
    )
  }

  if (rows.length === 0) {
    return (
      <p className="grid min-h-56 place-items-center text-center text-sm font-bold text-secondary">
        {t("recommendationListEmpty")}
      </p>
    )
  }

  return (
    <div className="grid gap-1">
      {rows.map((row) => (
        <RecommendationRowCard
          key={row.skuId}
          highlighted={row.skuId === highlightedSkuId}
          row={row}
        />
      ))}
    </div>
  )
}
