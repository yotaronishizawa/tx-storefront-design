import { AlertCircle, Ban, TriangleAlert } from "lucide-react"
import { useTranslation } from "react-i18next"

import { cn } from "~/utils/cn"

import type { CabinetSummary } from "./cabinet-tabs"

export function CabinetTabLabel({
  disabled = false,
  name,
  summary,
}: {
  disabled?: boolean
  name: string
  summary?: CabinetSummary
}) {
  const { t } = useTranslation("app")

  const disabledIcon = disabled && (
    <Ban aria-label={t("robotDisplayExcluded")} className="size-4" role="img" />
  )

  if (!summary) {
    return (
      <>
        {disabledIcon}
        {name}
      </>
    )
  }

  const toRemoveCount = summary.toRemoveCount ?? 0

  return (
    <>
      {disabledIcon}
      {name}
      {toRemoveCount > 0 ? (
        <span
          aria-label={t("skuRemovalLaneCount", { count: toRemoveCount })}
          className="absolute -top-2 -right-2 rounded-full bg-error px-2 text-xs/5 font-bold text-inverse ring-2 ring-white"
        >
          {toRemoveCount}
        </span>
      ) : (
        summary.addedCount > 0 && (
          <span
            aria-label={t("laneAddedCount", { count: summary.addedCount })}
            className="absolute -top-2 -right-2 rounded-full bg-success px-2 text-xs/5 font-bold text-inverse ring-2 ring-white"
          >
            +{summary.addedCount}
          </span>
        )
      )}
      <span
        className={cn(
          "inline-flex h-6 items-center gap-1 rounded-full px-2 text-xs font-bold",
          getSummaryClassName(summary)
        )}
      >
        {summary.hasError && (
          <AlertCircle
            aria-label={t("laneLegendError")}
            className="size-3.5"
            role="img"
          />
        )}
        {summary.hasWarning && !summary.hasError && (
          <TriangleAlert
            aria-label={t("cabinetAttentionWarning")}
            className="size-3.5"
            role="img"
          />
        )}
        {t("cabinetDrinkCount", { count: summary.drinkCount })}
      </span>
    </>
  )
}

function getSummaryClassName(summary: CabinetSummary) {
  if (summary.hasError) {
    return "bg-error-subtle text-error"
  }
  if (summary.hasWarning) {
    return "bg-warning-subtle text-primary"
  }
  return "bg-muted text-secondary"
}
