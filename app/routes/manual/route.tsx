import { useMemo } from "react"

import { useTranslation } from "react-i18next"

import {
  readAppShellState,
  useBusyAction,
  useOpenDialog,
} from "~/domains/app-shell"
import {
  readOperationsState,
  selectManualReplenishmentRequest,
  useManualReplenishmentRequest,
} from "~/domains/operations"
import {
  useErrorLaneGuide,
  useLaneDrawer,
  useManualStartAudio,
  usePulledLane,
  useRequestManualStart,
} from "~/domains/restocking"
import {
  useErrorLaneIds,
  useLaneMatchCheck,
  useMisplacedStock,
  useShelfReadOnOpen,
  useShelfSelection,
  useSkuById,
  useStockBoard,
} from "~/domains/shelf"
import { useSelectedStore } from "~/domains/store-selection"
import { useCurrentTime } from "~/hooks/use-current-time"
import { isRequestInProgress } from "~/model/request-state"
import { findAgedLaneIds } from "~/model/shelf"
import { getAgedStockRule, hasShelfClient } from "~/model/store-display"
import { ManualReplenishmentView } from "~/views/shelf/manual-replenishment"

import { LeaveConfirmDialog } from "../_components/leave-confirm-dialog"
import { useRobotArm } from "../_hooks/use-robot-arm"
import { useLeaveWhenManualCloses } from "./_hooks/use-leave-when-manual-closes"

export default function ManualPage() {
  const robotArm = useRobotArm()
  const { t } = useTranslation(["app", "common"])
  const stockBoard = useStockBoard()
  const skuById = useSkuById()
  const selection = useShelfSelection()
  const manualRequest = useManualReplenishmentRequest()
  const busyAction = useBusyAction()
  const openDialog = useOpenDialog()
  const requestManualStart = useRequestManualStart()
  const errorLaneIds = useErrorLaneIds()
  const laneDrawer = useLaneDrawer()
  const { checkLaneMatched } = useLaneMatchCheck()
  const pulledLane = usePulledLane()
  const misplacedStock = useMisplacedStock()
  const selectedStore = useSelectedStore()
  const agedStockRule = getAgedStockRule(selectedStore)
  const now = useCurrentTime()
  const agedLaneIds = useMemo(
    () => findAgedLaneIds(stockBoard, skuById, agedStockRule, now),
    [agedStockRule, now, skuById, stockBoard]
  )
  useLeaveWhenManualCloses()
  useShelfReadOnOpen()
  useErrorLaneGuide({ manual: true })
  useManualStartAudio(agedLaneIds.size > 0)

  return (
    <>
      <ManualReplenishmentView
        robotArm={robotArm}
        agedLaneIds={agedLaneIds}
        agedStockRule={agedStockRule}
        board={stockBoard}
        busyAction={busyAction}
        errorLaneIds={errorLaneIds}
        isMisplacedSku={(skuId) => misplacedStock.skuIds.has(skuId)}
        laneDrawerId={laneDrawer.laneDrawerId}
        manualReplenishmentAvailable={hasShelfClient(selectedStore)}
        misplacedLaneIds={misplacedStock.laneIds}
        pulledLane={pulledLane}
        request={manualRequest}
        selection={selection}
        skuById={skuById}
        onCheckLaneMatched={checkLaneMatched}
        onCloseLane={laneDrawer.closeLane}
        onFinish={() => openDialog("manual-finish")}
        onOpenLane={laneDrawer.openLane}
        onStart={() => void requestManualStart()}
      />
      {/* OPM keeps the task open on leaving; nothing is sent. */}
      <LeaveConfirmDialog
        cancelLabel={t("common:actions.cancel")}
        confirmLabel={t("common:actions.ok")}
        message={t("manualLeaveConfirm")}
        shouldBlock={isManualInProgress}
        onLeave={dismissManualTaskPrompt}
      />
    </>
  )
}

function isManualInProgress(): boolean {
  return isRequestInProgress(
    selectManualReplenishmentRequest(readOperationsState())
  )
}

/** So the task is not offered back on the next page. */
function dismissManualTaskPrompt() {
  const request = selectManualReplenishmentRequest(readOperationsState())
  if (request) {
    readAppShellState().dismissManualTaskPromptFor(request.requestId)
  }
}
