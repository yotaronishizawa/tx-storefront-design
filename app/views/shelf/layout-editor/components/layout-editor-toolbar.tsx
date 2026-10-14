import { RotateCcw, Search, Send } from "lucide-react"
import { useTranslation } from "react-i18next"

import { CabinetTabs } from "~/components/shelf/cabinet-tabs"
import { FEATURES } from "~/config/feature"
import { Button, Checkbox } from "~/core"
import type { LayoutCabinet } from "~/model/shelf"
import { cn } from "~/utils/cn"

export function LayoutEditorToolbar({
  activeCabinetDisabled,
  board,
  canToggleCabinet,
  currentCabinet,
  disabledCabinets,
  hasChanges,
  hasSelection,
  sending,
  onClearSelection,
  onOpenReplacePicker,
  onRequestSend,
  onSelectCabinet,
  onSetCabinetDisabled,
}: {
  activeCabinetDisabled: boolean
  board: LayoutCabinet[]
  canToggleCabinet: boolean
  currentCabinet?: LayoutCabinet
  disabledCabinets: ReadonlySet<number>
  hasChanges: boolean
  hasSelection: boolean
  sending: boolean
  onClearSelection: () => void
  onOpenReplacePicker: () => void
  onRequestSend: () => void
  onSelectCabinet: (cabinet: number) => void
  onSetCabinetDisabled: (disabled: boolean) => void
}) {
  const { t } = useTranslation(["app", "common"])

  return (
    <div className="mb-3 flex shrink-0 flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <CabinetTabs
          board={board}
          disabledCabinets={disabledCabinets}
          kind="display"
          value={currentCabinet?.cabinet}
          onChange={onSelectCabinet}
        />

        <div className="mt-3 flex min-h-9 flex-wrap items-center gap-3">
          <span className="text-xs font-bold">
            {t("common:shelf.display")}
            {currentCabinet?.cabinet}:
          </span>
          {FEATURES.cabinetExclusion && (
            <label
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-md bg-subtle px-3 text-xs font-bold",
                !canToggleCabinet && "text-disabled"
              )}
            >
              <Checkbox.Root
                checked={activeCabinetDisabled}
                disabled={!canToggleCabinet}
                onCheckedChange={onSetCabinetDisabled}
              />
              {t("robotDisplayExcluded")}
            </label>
          )}
          {hasChanges && (
            <span className="rounded-full bg-warning-subtle px-3 py-1 text-xs font-bold text-primary">
              {t("layoutUnsavedChanges")}
            </span>
          )}
        </div>
      </div>

      <div className="grid shrink-0 gap-2">
        <div className="flex justify-end gap-2">
          <Button
            busy={sending}
            className="min-w-28"
            icon={<Send />}
            size="sm"
            type="button"
            onClick={onRequestSend}
          >
            {t("sendLayout")}
          </Button>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            className="min-w-32"
            disabled={!hasSelection}
            icon={<Search />}
            size="sm"
            type="button"
            onClick={onOpenReplacePicker}
          >
            {t("editSelectedProducts")}
          </Button>
          <Button
            className="min-w-28"
            disabled={!hasSelection}
            icon={<RotateCcw />}
            size="sm"
            type="button"
            variant="secondary"
            onClick={onClearSelection}
          >
            {t("common:actions.clearWithEntity", {
              entity: t("common:entity.selection", { count: 1 }),
            })}
          </Button>
        </div>
      </div>
    </div>
  )
}
