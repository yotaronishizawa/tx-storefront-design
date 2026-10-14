import type { ReactNode } from "react"

import { useTranslation } from "react-i18next"

import { cn } from "~/utils/cn"

import { LaneBadge } from "./lane-badge"
import type { LaneLegendKey } from "./lane-states"

const LEGEND_ORDER: LaneLegendKey[] = [
  "canPlace",
  "cannotPlace",
  "added",
  "lastAdded",
  "error",
  "warning",
  "unused",
]

const LEGEND_LABEL_KEYS = {
  added: "laneLegendAdded",
  canPlace: "laneLegendCanPlace",
  cannotPlace: "laneLegendCannotPlace",
  error: "laneLegendError",
  lastAdded: "laneLegendLastAdded",
  unused: "laneLegendUnused",
  warning: "laneLegendWarning",
} as const satisfies Record<LaneLegendKey, string>

/** An entry shows only while some lane is in that state. */
export function LaneLegend({
  present,
}: {
  present: ReadonlySet<LaneLegendKey>
}) {
  const { t } = useTranslation("app")
  const keys = LEGEND_ORDER.filter((key) => present.has(key))
  if (keys.length === 0) {
    return null
  }

  return (
    <ul className="flex min-w-0 flex-wrap items-center justify-end gap-x-3 gap-y-1 text-xs font-bold text-secondary">
      {keys.map((key) => (
        <li key={key} className="inline-flex items-center gap-1">
          {LEGEND_SWATCHES[key]}
          {t(LEGEND_LABEL_KEYS[key])}
        </li>
      ))}
    </ul>
  )
}

const SWATCH = "inline-grid size-3.5 shrink-0 place-items-center rounded-sm"

const LEGEND_SWATCHES: Record<LaneLegendKey, ReactNode> = {
  added: (
    <span className="rounded-full bg-success px-1 text-xs/3.5 font-bold text-inverse">
      +1
    </span>
  ),
  cannotPlace: <span className={cn(SWATCH, "bg-muted")} />,
  canPlace: (
    <span className={cn(SWATCH, "border-2 border-success bg-success-subtle")} />
  ),
  error: <LaneBadge className="size-3.5" kind="error" />,
  lastAdded: (
    <span className={cn(SWATCH, "bg-default ring-2 ring-info ring-inset")} />
  ),
  unused: <span className={cn(SWATCH, "bg-inverse/70")} />,
  warning: <LaneBadge className="size-3.5" kind="warning" />,
}
