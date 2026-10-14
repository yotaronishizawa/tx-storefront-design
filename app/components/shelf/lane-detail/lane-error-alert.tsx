import { TriangleAlert } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { LaneErrorSummary } from "~/model/shelf"

/** A discrepancy is headed by the board's error-lane count, a size constraint by its own title. */
export function LaneErrorAlert({
  errorLaneCount,
  summary,
}: {
  errorLaneCount: number
  summary: LaneErrorSummary
}) {
  const { t } = useTranslation("app")
  const constraint = summary.kind === "constraint"

  return (
    <div
      className="mt-4 rounded-lg border-2 border-error bg-error-subtle p-4"
      role="alert"
    >
      <p className="flex items-center gap-2 text-xs font-bold text-error">
        <TriangleAlert className="size-4 shrink-0" />
        {constraint
          ? t("laneErrorTitle")
          : t("laneErrorCount", { count: Math.max(errorLaneCount, 1) })}
      </p>
      <p className="mt-2 text-base/snug font-bold whitespace-pre-line text-primary">
        {constraint ? t("laneConstraintError") : t("laneDiscrepancyError")}
      </p>
      {/* The operator reads the code out to the operations centre. */}
      <ul className="mt-2 space-y-1 text-xs font-bold text-error">
        {summary.details.map((detail) => (
          <li key={detail.code}>
            {t(detail.messageKey)}{" "}
            <span className="whitespace-nowrap opacity-75">
              {t("laneErrorCode", { code: detail.code })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
