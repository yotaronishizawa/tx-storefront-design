import { AlertTriangle, Ban, CheckCircle2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { cn } from "~/utils/cn"

/** The chips beside the shelf title: lane errors and out-of-use lanes. */
export function ManualSessionStatus({
  errorLaneCount,
  hasBlockedLane,
}: {
  errorLaneCount: number
  /** Some lane is out of use while the operations centre checks it. */
  hasBlockedLane: boolean
}) {
  const { t } = useTranslation("app")
  const chip =
    "inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-bold [&_svg]:size-4"

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <span
        className={cn(
          chip,
          errorLaneCount > 0
            ? "bg-error-subtle text-error"
            : "bg-success-subtle text-success"
        )}
      >
        {errorLaneCount > 0 ? <AlertTriangle /> : <CheckCircle2 />}
        {errorLaneCount > 0
          ? t("manualIssueCount", { count: errorLaneCount })
          : t("manualNoIssues")}
      </span>
      {hasBlockedLane && (
        <span className={cn(chip, "bg-muted text-secondary")}>
          <Ban />
          {t("laneOutOfService")}
        </span>
      )}
    </div>
  )
}
