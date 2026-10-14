import { Check, Plus, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { Sku } from "~/api/opm/schemas"
import { LaneTile } from "~/components/shelf/lane-tile"
import { Button } from "~/core"
import { getCellSkuId, isLocationBlocked, type LayoutCell } from "~/model/shelf"
import { getLocalizedSkuName } from "~/model/sku"
import { cn } from "~/utils/cn"

function getCellState(selected: boolean, changed: boolean) {
  if (selected) {
    return "selected"
  }
  if (changed) {
    return "edited"
  }
  return "idle"
}

const EDGE_BUTTON_CLASS =
  "absolute grid size-7 place-items-center rounded-full border border-strong bg-default text-primary active:bg-muted [&_svg]:size-3.5"

export function ChangeLayoutCellButton({
  canEditLanes = false,
  cell,
  changed = false,
  removed = false,
  selected = false,
  skuById,
  onClick,
  onInsertBefore,
  onRemove,
}: {
  canEditLanes?: boolean
  cell: LayoutCell
  changed?: boolean
  removed?: boolean
  selected?: boolean
  skuById: Map<string, Sku>
  onClick?: () => void
  onInsertBefore?: () => void
  onRemove?: () => void
}) {
  const { i18n, t } = useTranslation("app")

  const skuId = getCellSkuId(cell, "display")
  const sku = skuId ? skuById.get(skuId) : undefined
  const blocked = Boolean(cell.location && isLocationBlocked(cell.location))

  return (
    <div className="relative">
      <LaneTile
        aria-label={`${t("workflow.layout.faceLocation", { cabinet: cell.cabinet, row: cell.row + 1, face: cell.column })} ${getLocalizedSkuName(sku, i18n.language)}`}
        aria-pressed={selected}
        cell={cell}
        className={cn(
          changed && !selected && "border-warning bg-warning-subtle",
          removed && "border-error bg-error-subtle",
          blocked && "opacity-40"
        )}
        disabled={!cell.location}
        skuById={skuById}
        state={getCellState(selected, changed)}
        onClick={onClick}
      >
        {changed && (
          <span
            className={cn(
              "absolute -top-1.5 -left-1.5 z-10 grid size-5 place-items-center rounded-full",
              removed ? "bg-error text-inverse" : "bg-warning text-on-primary"
            )}
          >
            {removed ? (
              <Trash2 className="size-3.5" />
            ) : (
              <Check className="size-3.5" />
            )}
          </span>
        )}
      </LaneTile>
      {canEditLanes && (
        <Button
          variant="unstyled"
          size="unstyled"
          aria-label={t("layoutInsertLaneBefore")}
          className={cn(
            EDGE_BUTTON_CLASS,
            "top-1/2 -left-3.5 -translate-y-1/2"
          )}
          type="button"
          onClick={onInsertBefore}
        >
          <Plus />
        </Button>
      )}
      {canEditLanes && selected && (
        <Button
          variant="unstyled"
          size="unstyled"
          aria-label={`${t("layoutRemoveLane")} ${getLocalizedSkuName(sku, i18n.language)} ${skuId}`}
          className={cn(EDGE_BUTTON_CLASS, "-top-2 -right-2")}
          type="button"
          onClick={onRemove}
        >
          <Trash2 />
        </Button>
      )}
    </div>
  )
}
