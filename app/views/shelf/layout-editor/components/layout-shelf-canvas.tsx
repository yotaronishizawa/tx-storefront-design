import { useState, type ReactNode } from "react"

import { useTranslation } from "react-i18next"

import { ShelfGrid } from "~/components/shelf/shelf-grid"
import { ToggleGroup } from "~/core"
import type { LayoutCabinet, LayoutCell, LayoutRow } from "~/model/shelf"
import { cn } from "~/utils/cn"

/** On a phone, choose a shelf row instead of shrinking every product face. */
export function LayoutShelfCanvas({
  cabinet,
  renderCell,
  renderRowEnd,
}: {
  cabinet?: LayoutCabinet
  renderCell: (cell: LayoutCell, row: LayoutRow) => ReactNode
  renderRowEnd?: (row: LayoutRow) => ReactNode
}) {
  const { t } = useTranslation("app")
  const [focusedRow, setFocusedRow] = useState<number | null>(null)
  const activeRow =
    cabinet?.rows.find((row) => row.row === focusedRow) ?? cabinet?.rows[0]
  return (
    <div className="flex min-h-72 min-w-0 shrink-0 flex-col rounded-lg border border-default bg-subtle md:min-h-0 md:flex-1">
      <div className="shrink-0 border-b border-default px-3 py-2 md:hidden">
        <p className="mb-2 text-sm font-bold text-secondary">
          {t("workflow.layout.chooseRow")}
        </p>
        <ToggleGroup
          className="flex gap-2 overflow-auto"
          itemClassName={(selected) =>
            cn(
              "h-11 shrink-0 rounded-md border-2 px-4 text-base font-bold",
              selected
                ? "border-strong bg-default"
                : "border-transparent bg-muted"
            )
          }
          options={(cabinet?.rows ?? []).map((row) => ({
            value: String(row.row),
            label: t("workflow.layout.row", { row: row.row + 1 }),
          }))}
          value={String(activeRow?.row ?? "")}
          onValueChange={(value) => setFocusedRow(Number(value))}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3 md:hidden">
        <ShelfGrid
          cabinet={
            cabinet && activeRow ? { ...cabinet, rows: [activeRow] } : cabinet
          }
          kind="display"
          renderCell={renderCell}
          renderRowEnd={renderRowEnd}
        />
      </div>
      <div className="hidden min-h-0 flex-1 overflow-auto p-3 md:block">
        <ShelfGrid
          cabinet={cabinet}
          kind="display"
          renderCell={renderCell}
          renderRowEnd={renderRowEnd}
        />
      </div>
    </div>
  )
}
