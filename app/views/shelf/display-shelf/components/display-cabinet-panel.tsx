import { Ban } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { Sku } from "~/api/opm/schemas"
import { ShelfGrid } from "~/components/shelf/shelf-grid"
import {
  isDisplayCellSelected,
  type LayoutCabinet,
  type LayoutCell,
  type SelectedCell,
} from "~/model/shelf"

import { DisplayLaneButton } from "./display-lane-button"

export function DisplayCabinetPanel({
  cabinet,
  diffCellIds,
  disabled = false,
  hint,
  label,
  selectedCell,
  skuById,
  onCellClick,
  onCellDetail,
}: {
  cabinet?: LayoutCabinet
  diffCellIds?: Set<string>
  /** The whole cabinet is switched off: its lanes show but cannot be picked. */
  disabled?: boolean
  /** Shown after the label, on the same line. */
  hint?: string
  label: string
  selectedCell: SelectedCell
  skuById: Map<string, Sku>
  onCellClick?: (cell: LayoutCell) => void
  onCellDetail?: (cell: LayoutCell) => void
}) {
  const { t } = useTranslation("app")

  return (
    <section className="flex min-h-0 min-w-0 flex-col overflow-hidden">
      <div className="mb-2 flex shrink-0 items-baseline gap-4">
        <h3 className="text-xs font-bold text-secondary">{label}</h3>
        {hint && <p className="text-xs font-bold text-primary">{hint}</p>}
      </div>
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div
          className="min-h-0 flex-1 overflow-hidden rounded-md bg-subtle p-2"
          inert={disabled}
        >
          <ShelfGrid
            cabinet={cabinet}
            kind="display"
            renderCell={(cell) => (
              <DisplayLaneButton
                cell={cell}
                changed={diffCellIds?.has(cell.id)}
                selected={isDisplayCellSelected(selectedCell, cell)}
                skuById={skuById}
                onClick={() => onCellClick?.(cell)}
                onDetail={() => onCellDetail?.(cell)}
              />
            )}
          />
        </div>
        {disabled && (
          <div className="absolute inset-0 grid place-items-center rounded-md bg-overlay p-4">
            <p className="inline-flex items-center gap-2 rounded-md bg-default px-4 py-3 text-sm font-bold text-secondary">
              <Ban className="size-5 shrink-0" />
              {t("displayCabinetDisabled")}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
