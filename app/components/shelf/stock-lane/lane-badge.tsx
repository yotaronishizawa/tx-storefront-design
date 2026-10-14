import { AlertCircle, TriangleAlert } from "lucide-react"
import { useTranslation } from "react-i18next"

import { cn } from "~/utils/cn"

import type { LaneBadgeKind } from "./lane-states"

const BADGES = {
  error: {
    className: "bg-error text-inverse",
    icon: AlertCircle,
    label: "laneLegendError",
  },
  warning: {
    className: "bg-warning text-inverse",
    icon: TriangleAlert,
    label: "laneLegendWarning",
  },
} as const satisfies Record<LaneBadgeKind, unknown>

/** The corner marker for a lane error or warning; the legend renders the same one. */
export function LaneBadge({
  className,
  kind,
}: {
  className?: string
  kind: LaneBadgeKind
}) {
  const { t } = useTranslation("app")
  const { className: tone, icon: Icon, label } = BADGES[kind]

  return (
    <span
      aria-label={t(label)}
      className={cn(
        "grid shrink-0 place-items-center rounded-full [&_svg]:size-[70%]",
        tone,
        className
      )}
      role="img"
    >
      <Icon aria-hidden strokeWidth={2.75} />
    </span>
  )
}
