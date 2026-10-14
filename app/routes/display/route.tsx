import { useEffect } from "react"

import { useTranslation } from "react-i18next"

import { ConfirmDialog } from "~/components/dialog/confirm-dialog"
import { readAppShellState, useBusyAction } from "~/domains/app-shell"
import { useTemporaryDisplayLocations } from "~/domains/operations"
import {
  readShelfState,
  useDisplayBoard,
  useDisplayHistories,
  useDisplayManualJobs,
  useDisplayPageData,
  useDisplayReservationActions,
  useDisplaySpec,
  useShelfSelection,
  useSkuById,
  useStuckLaneActions,
  useStuckLaneIds,
} from "~/domains/shelf"
import { DisplayShelfView } from "~/views/shelf/display-shelf"

export default function DisplayPage() {
  const { t } = useTranslation(["app", "common"])
  useDisplayPageData()
  const displayBoard = useDisplayBoard()
  const displayHistories = useDisplayHistories()
  const displayManualJobs = useDisplayManualJobs()
  const displaySpec = useDisplaySpec()
  const skuById = useSkuById()
  const temporaryLocations = useTemporaryDisplayLocations()
  const { selectCell, selectedCell } = useShelfSelection()
  const busyAction = useBusyAction()
  const { reserveDisplayLane } = useDisplayReservationActions()
  const stuckLaneIds = useStuckLaneIds()
  const { markStuckLanesFixed, waitForOperationsTeam } = useStuckLaneActions()

  // Leaving the page drops its lane selection; a stock lane picked elsewhere is left alone.
  useEffect(
    () => () => {
      if (readShelfState().selectedCell?.kind === "display") {
        readShelfState().selectCell(null)
      }
    },
    []
  )

  return (
    <>
      <DisplayShelfView
        board={displayBoard}
        busyAction={busyAction}
        histories={displayHistories}
        manualJobs={displayManualJobs}
        selectedCell={selectedCell}
        skuById={skuById}
        spec={displaySpec}
        temporaryLocations={temporaryLocations}
        onReserveLane={(locationId) => {
          void reserveDisplayLane(locationId)
        }}
        onSelect={selectCell}
        onUnknownSku={() =>
          readAppShellState().setError(t("displayProductInfoNotFound"))
        }
      />
      <ConfirmDialog
        cancelLabel={t("stuckLaneWait")}
        confirmLabel={t("stuckLaneFixed")}
        message={t("stuckLaneMessage")}
        open={stuckLaneIds.length > 0}
        onCancel={waitForOperationsTeam}
        onConfirm={() => void markStuckLanesFixed()}
      />
    </>
  )
}
