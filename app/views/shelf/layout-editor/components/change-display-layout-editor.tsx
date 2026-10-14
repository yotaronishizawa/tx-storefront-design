import { useState } from "react"

import {
  ArrowRight,
  Check,
  Clock3,
  Eye,
  RefreshCw,
  RotateCcw,
  Save,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import type { Sku } from "~/api/opm/schemas"
import { ConfirmDialog } from "~/components/dialog/confirm-dialog"
import { MessageDialog } from "~/components/dialog/message-dialog"
import { CabinetTabs } from "~/components/shelf/cabinet-tabs"
import { ShelfGrid } from "~/components/shelf/shelf-grid"
import { FEATURES } from "~/config/feature"
import { Button, Checkbox } from "~/core"
import { isCellChanged, type LayoutCabinet } from "~/model/shelf"
import type { BusyAction } from "~/types/busy-action"

import type { LayoutEditor } from "../hooks/use-layout-editor"
import { getLayoutDiff } from "../utils/layout-diff"
import { ChangeLayoutCellButton } from "./change-layout-cell-button"
import { DraftPromptDialog } from "./draft-prompt-dialog"
import { LayoutChangeReview } from "./layout-change-review"
import { LayoutSelectionBar } from "./layout-selection-bar"
import { LayoutSendDialogs } from "./layout-send-dialogs"
import { ProductPickerOverlay } from "./product-picker-overlay"
import { RowLaneButtons } from "./row-lane-buttons"
import { SameJanDialog } from "./same-jan-dialog"

export function ChangeDisplayLayoutEditor({
  board,
  busyAction,
  editor,
  isOnline,
  hasPendingSubmission,
  pendingIssue,
  robotWillStop,
  skuById,
}: {
  board: LayoutCabinet[]
  busyAction: BusyAction
  editor: LayoutEditor
  isOnline: boolean
  hasPendingSubmission: boolean
  pendingIssue: string
  robotWillStop: boolean
  skuById: Map<string, Sku>
}) {
  const {
    activeCabinetDisabled,
    canToggleActiveCabinet,
    currentCabinet,
    disabledCabinets,
    draftPromptOpen,
    facesChanged,
    filteredSkus,
    hasChanges,
    message,
    originalSkuByLocationId,
    pendingHeightOperation,
    pendingSameJan,
    pickerOpen,
    search,
    selectedIds,
    send,
  } = editor
  const { t } = useTranslation(["app", "common"])
  const [discardOpen, setDiscardOpen] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)
  const diff = getLayoutDiff(editor.initialBoard, board)
  const pending =
    hasPendingSubmission ||
    send.submissionStatus === "accepted" ||
    send.submissionStatus === "review"
  const reviewRequired =
    Boolean(pendingIssue) || send.submissionStatus === "review"
  const locked = pending || Boolean(busyAction) || send.checking
  const canEditLanes = facesChanged && !activeCabinetDisabled && !locked

  return (
    <section className="relative flex min-h-0 min-w-0 flex-1 flex-col gap-3 rounded-lg border bg-default p-4">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{t("workflow.layout.title")}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-secondary">
            <Eye className="size-4" />
            {t("workflow.layout.viewpoint")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            disabled={locked || !hasChanges}
            icon={<Save />}
            variant="secondary"
            onClick={editor.saveDraftManually}
          >
            {t("workflow.layout.saveDraft")}
          </Button>
          <Button
            busy={
              send.checking ||
              busyAction === "save-layout" ||
              busyAction === "robot-to-rest"
            }
            disabled={locked || !hasChanges || !isOnline}
            icon={<ArrowRight />}
            onClick={() => {
              void send.requestSend()
            }}
          >
            {t("workflow.layout.review")}
          </Button>
        </div>
      </div>
      {pending ? (
        <div className="flex shrink-0 items-center gap-3 rounded-lg border border-info bg-info-subtle p-3">
          <Clock3 className="size-6 shrink-0 text-info" />
          <div className="min-w-0 flex-1">
            <p className="font-bold">
              {t(
                reviewRequired
                  ? "workflow.layout.reviewRequired"
                  : "workflow.layout.accepted"
              )}
            </p>
            <p className="text-sm">
              {t(
                reviewRequired
                  ? "workflow.layout.reviewRequiredHint"
                  : "workflow.layout.waitingForReadback"
              )}
            </p>
          </div>
          <Button
            busy={Boolean(busyAction) || send.checking}
            icon={<RefreshCw />}
            variant="secondary"
            onClick={() => {
              void send.refreshSubmissionStatus()
            }}
          >
            {t("workflow.layout.checkStatus")}
          </Button>
        </div>
      ) : send.submissionStatus === "applied" && !hasChanges ? (
        <div className="flex shrink-0 items-center gap-3 rounded-lg bg-success-subtle p-3 font-bold text-success">
          <Check className="size-6" />
          {t("workflow.layout.applied")}
        </div>
      ) : null}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <CabinetTabs
          board={board}
          disabledCabinets={disabledCabinets}
          kind="display"
          value={currentCabinet?.cabinet}
          onChange={editor.selectCabinet}
        />
        {FEATURES.cabinetExclusion && (
          <label className="flex items-center gap-2 text-sm text-secondary">
            <Checkbox.Root
              checked={activeCabinetDisabled}
              disabled={locked || !canToggleActiveCabinet}
              onCheckedChange={editor.setCabinetDisabled}
            />
            {t("robotDisplayExcluded")}
          </label>
        )}
        {hasChanges && (
          <span className="rounded-full bg-warning-subtle px-3 py-1 text-sm font-bold">
            {t("workflow.layout.unsentCount", { count: diff.changes.size })}
          </span>
        )}
      </div>

      <div className="min-h-48 flex-1 overflow-hidden rounded-md bg-subtle p-2">
        <ShelfGrid
          cabinet={currentCabinet}
          kind="display"
          renderCell={(cell) => (
            <ChangeLayoutCellButton
              canEditLanes={canEditLanes}
              cell={cell}
              changed={isCellChanged(cell, originalSkuByLocationId)}
              selected={selectedIds.includes(cell.id)}
              skuById={skuById}
              onClick={locked ? undefined : () => editor.toggleCell(cell)}
              onInsertBefore={() =>
                editor.openInsertPicker({
                  beforeLocationId: cell.id,
                  cabinet: cell.cabinet,
                  neighborLocationId: cell.id,
                  row: cell.row,
                })
              }
              onRemove={() => editor.removeCell(cell.id)}
            />
          )}
          renderRowEnd={
            canEditLanes
              ? (row) => (
                  <RowLaneButtons
                    canAdd={row.cells.length > 0}
                    canRemove={row.cells.some((cell) =>
                      selectedIds.includes(cell.id)
                    )}
                    onAdd={() =>
                      editor.openInsertPicker({
                        beforeLocationId: null,
                        cabinet: row.cells[0]?.cabinet ?? 0,
                        neighborLocationId: row.cells.at(-1)?.id ?? "",
                        row: row.row,
                      })
                    }
                    onRemove={() => editor.removeSelectedLanesInRow(row)}
                  />
                )
              : undefined
          }
        />
      </div>
      {!locked && (
        <LayoutSelectionBar
          board={board}
          selectedIds={selectedIds}
          skuById={skuById}
          canEditLanes={canEditLanes}
          onClear={editor.clearSelection}
          onReplace={editor.openReplacePicker}
          onRemove={() => setRemoveOpen(true)}
        />
      )}
      {hasChanges && !locked && (
        <div className="flex shrink-0 items-center justify-between gap-3">
          <p className="text-sm text-secondary">
            {t("workflow.layout.pendingLegend")}
          </p>
          <Button
            icon={<RotateCcw />}
            size="sm"
            variant="secondary"
            onClick={() => setDiscardOpen(true)}
          >
            {t("workflow.layout.discard")}
          </Button>
        </div>
      )}

      <ProductPickerOverlay
        filteredSkus={filteredSkus}
        selectedCells={board
          .flatMap((cabinet) => cabinet.rows.flatMap((row) => row.cells))
          .filter((cell) => selectedIds.includes(cell.id))}
        insertTarget={editor.insertTarget}
        open={pickerOpen}
        search={search}
        onClose={editor.closePicker}
        onSearch={editor.setSearch}
        onSelectSku={editor.beginProductOperation}
      />

      <LayoutSendDialogs send={send} skuById={skuById} />
      {send.step?.kind === "confirm" && (
        <LayoutChangeReview
          before={editor.initialBoard}
          after={board}
          cabinetNumber={currentCabinet?.cabinet}
          skuById={skuById}
          busy={Boolean(busyAction)}
          robotWillStop={robotWillStop}
          onCancel={send.cancel}
          onConfirm={() => {
            void send.confirmSend()
          }}
        />
      )}
      <ConfirmDialog
        cancelLabel={t("common:actions.cancel")}
        confirmLabel={t("workflow.layout.discard")}
        message={t("workflow.layout.discardConfirm")}
        open={discardOpen}
        onCancel={() => setDiscardOpen(false)}
        onConfirm={() => {
          setDiscardOpen(false)
          editor.discardChanges()
        }}
      />
      <ConfirmDialog
        cancelLabel={t("common:actions.cancel")}
        confirmLabel={t("workflow.layout.removeSelected")}
        message={t("workflow.layout.removeConfirm", {
          count: selectedIds.length,
        })}
        open={removeOpen}
        onCancel={() => setRemoveOpen(false)}
        onConfirm={() => {
          setRemoveOpen(false)
          editor.removeSelectedLanes()
        }}
      />
      <ConfirmDialog
        cancelLabel={t("common:actions.cancel")}
        confirmLabel={t("common:actions.ok")}
        message={t("layoutTallerProductWarning")}
        open={Boolean(pendingHeightOperation)}
        onCancel={editor.cancelHeightOperation}
        onConfirm={editor.confirmHeightOperation}
      />
      <SameJanDialog
        existingSku={
          pendingSameJan ? skuById.get(pendingSameJan.existingSkuId) : undefined
        }
        nextSku={
          pendingSameJan
            ? skuById.get(pendingSameJan.operation.skuId)
            : undefined
        }
        open={Boolean(pendingSameJan)}
        onNo={() => editor.confirmSameJan(false)}
        onYes={() => editor.confirmSameJan(true)}
      />
      <MessageDialog
        message={message}
        okLabel={t("common:actions.ok")}
        open={Boolean(message)}
        onClose={editor.clearMessage}
      />
      <DraftPromptDialog
        open={draftPromptOpen}
        onApply={editor.applyDraft}
        onSkip={editor.skipDraft}
      />
    </section>
  )
}
