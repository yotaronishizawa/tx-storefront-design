import { useState } from "react"

import { MapPin } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button, Dialog } from "~/core"
import { useRestockRequest } from "~/domains/operations"
import {
  readRestockingState,
  useRecoveryLaneId,
  useRestockingLaneAdditions,
} from "~/domains/restocking"
import { useErrorLaneIds, useStockBoard } from "~/domains/shelf"
import { isRequestInProgress } from "~/model/request-state"
import {
  findCell,
  findRow,
  getColumnLabel,
  getLocationLaneErrors,
  isConstraintError,
  isPlacedWithoutScanningError,
  type LayoutCabinet,
} from "~/model/shelf"

/**
 * Restock study, in place of the lane-error popup: whenever a lane turns red
 * while restocking, whatever the cause, it says over the screen they are on
 * what happened and where, in one line each, and "Fix the lane" takes them to
 * that lane's fix screen. The screen never changes by itself. A scan closes
 * it (the drink just scanned is guided as usual); the red banner stays.
 */
export function RestockErrorPopup() {
  const { t } = useTranslation(["app", "common"])
  const errorLaneIds = useErrorLaneIds()
  const board = useStockBoard()
  const restocking = isRequestInProgress(useRestockRequest())
  const scannedAt = useRestockingLaneAdditions().lastScan?.scannedAt
  // A lane turning red while recovery steps are open waits behind them.
  const recovering = Boolean(useRecoveryLaneId())
  // The newest red lane, until closed, fixed, or a scan.
  const [laneId, setLaneId] = useState("")
  const [seenLaneIds, setSeenLaneIds] = useState(errorLaneIds)
  const [seenScannedAt, setSeenScannedAt] = useState(scannedAt)

  if (errorLaneIds !== seenLaneIds) {
    setSeenLaneIds(errorLaneIds)
    const raised = errorLaneIds.filter((id) => !seenLaneIds.includes(id))
    if (raised.length > 0) {
      setLaneId(raised[raised.length - 1] ?? "")
    } else if (laneId && !errorLaneIds.includes(laneId)) {
      setLaneId("")
    }
  }
  if (scannedAt !== seenScannedAt) {
    setSeenScannedAt(scannedAt)
    setLaneId("")
  }

  // What it last said, kept while it closes so the words do not change on the way out.
  const [shownLaneId, setShownLaneId] = useState(laneId)
  if (laneId && laneId !== shownLaneId) {
    setShownLaneId(laneId)
  }

  const cell = findCell(board, shownLaneId)
  const row = findRow(board, shownLaneId)
  const open = restocking && !recovering && Boolean(laneId && cell && row)
  const others = errorLaneIds.filter((id) => id !== shownLaneId).length

  return (
    <Dialog.Popup
      actions={
        <Dialog.Actions>
          <Button
            size="lg"
            onClick={() => {
              readRestockingState().requestErrorFix(laneId)
              setLaneId("")
            }}
          >
            {t("restockErrorsFix")}
          </Button>
        </Dialog.Actions>
      }
      closeLabel={t("common:actions.close")}
      icon="error"
      open={open}
      role="alertdialog"
      title={
        others > 0
          ? t("laneErrorCount", { count: others + 1 })
          : t("restockErrorPopupTitle")
      }
      onClose={() => setLaneId("")}
    >
      {cell && row && (
        <>
          <p className="whitespace-pre-line">
            {t(getErrorLine(board, shownLaneId))}
          </p>
          <p className="flex items-center gap-2 font-bold">
            <MapPin aria-hidden className="size-6 shrink-0 text-secondary" />
            {t("workflow.restock.location", {
              cabinet: cell.cabinet,
              row: cell.row,
              lane: getColumnLabel(cell, row, "stock"),
            })}
            {others > 0 && (
              <span className="font-normal text-secondary">
                {t("restockErrorPopupOthers", { count: others })}
              </span>
            )}
          </p>
        </>
      )}
    </Dialog.Popup>
  )
}

/** What happened, in the clerk's words: too big, not scanned, or the weight is off. */
function getErrorLine(board: LayoutCabinet[], laneId: string) {
  const location = findCell(board, laneId)?.location
  const errors = location ? getLocationLaneErrors(location) : []
  if (errors.some(isConstraintError)) {
    return "restockErrorPopupConstraint"
  }
  if (errors.some(isPlacedWithoutScanningError)) {
    return "restockErrorPopupUnscanned"
  }
  return "restockErrorPopupMismatch"
}
