import { useTranslation } from "react-i18next"

import { ToggleGroup } from "~/core"
import type { LayoutCabinet, ShelfKind } from "~/model/shelf"
import { cn } from "~/utils/cn"

import { CabinetTabLabel } from "./cabinet-tab-label"

/** What a cabinet tab shows beside its name. */
export type CabinetSummary = {
  /** Drinks added during the open restock; shown as a corner pill when above zero. */
  addedCount: number
  drinkCount: number
  /** A lane error; shown in place of the warning, which it outranks. */
  hasError: boolean
  /** Aged or misplaced stock — anything the operator should look at but that is not an error. */
  hasWarning: boolean
  /** Drinks of the SKU being removed; shown in place of `addedCount` when above zero. */
  toRemoveCount?: number
}

export function CabinetTabs({
  board,
  disabledCabinets,
  kind,
  summaries,
  value,
  onChange,
}: {
  board: LayoutCabinet[]
  /** Cabinets switched off as a whole; their tabs stay selectable but read as greyed out. */
  disabledCabinets?: ReadonlySet<number>
  kind: ShelfKind
  /** Keyed by cabinet number; a tab with no entry shows its name only. */
  summaries?: ReadonlyMap<number, CabinetSummary>
  value?: number
  onChange: (cabinet: number) => void
}) {
  const { t } = useTranslation("common")
  const prefix = kind === "display" ? t("shelf.display") : t("shelf.stock")

  return (
    <ToggleGroup
      className="flex w-fit max-w-full flex-wrap rounded-lg border border-strong/40 bg-muted p-0.5"
      itemClassName={(selected, cabinet) =>
        cn(
          // A divider before each segment, hidden beside the selected one.
          "relative inline-flex h-12 min-w-32 items-center justify-center gap-2 rounded-md border px-4 text-sm font-bold transition-colors",
          "not-first:before:absolute not-first:before:inset-y-3 not-first:before:-left-px not-first:before:border-l not-first:before:border-strong/40 data-pressed:before:hidden [[data-pressed]+&]:before:hidden",
          getTabClassName(
            selected,
            Boolean(disabledCabinets?.has(Number(cabinet)))
          )
        )
      }
      // Highest cabinet first; the board itself keeps cabinet 1 first so it is the default.
      options={[...board].reverse().map(({ cabinet }) => ({
        label: (
          <CabinetTabLabel
            disabled={disabledCabinets?.has(cabinet)}
            name={`${prefix}${cabinet}`}
            summary={summaries?.get(cabinet)}
          />
        ),
        value: String(cabinet),
      }))}
      value={String(value ?? "")}
      onValueChange={(next) => onChange(Number(next))}
    />
  )
}

function getTabClassName(selected: boolean, disabled: boolean) {
  if (selected) {
    return cn(
      "border-strong bg-default",
      disabled ? "text-disabled" : "text-primary"
    )
  }
  return cn(
    "border-transparent active:bg-subtle",
    disabled ? "text-disabled" : "text-secondary"
  )
}
