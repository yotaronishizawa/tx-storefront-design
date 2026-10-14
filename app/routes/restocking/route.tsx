import { useTranslation } from "react-i18next"

import { useBusyAction } from "~/domains/app-shell"
import {
  readOperationsState,
  refreshRequests,
  selectRestockRequest,
  useRestockRequest,
} from "~/domains/operations"
import {
  useErrorLaneGuide,
  useLaneDrawer,
  useRequestRestockingEnd,
  useRequestRestockingStart,
  useRestockingLaneAdditions,
  useRestockingPlacement,
  useRestockingResumeOnEntry,
  useRestockingScannedSkuRestore,
} from "~/domains/restocking"
import {
  useErrorLaneIds,
  useLaneMatchCheck,
  useMisplacedStock,
  useRecommendationCounts,
  useRecommendationCountsReadFailed,
  useRecommendationCountsReading,
  useShelfLayoutActions,
  useShelfReadOnOpen,
  useShelfSelection,
  useSkuById,
  useStockBoard,
  useStockDrinkRemoval,
} from "~/domains/shelf"
import {
  useSelectedStore,
  useStoreDataSettled,
} from "~/domains/store-selection"
import { useVisibleRefresh } from "~/hooks/use-visible-refresh"
import { isRequestInProgress } from "~/model/request-state"
import { getAgedStockRule } from "~/model/store-display"
import { RestockingBoardView } from "~/views/restocking/restocking-board"

import { LeaveConfirmDialog } from "../_components/leave-confirm-dialog"
import { useRobotArm } from "../_hooks/use-robot-arm"
import { LaneErrorDialog } from "./_components/lane-error-dialog"

export default function RestockingPage() {
  const robotArm = useRobotArm()
  const { t } = useTranslation(["app", "common"])
  const recommendationCounts = useRecommendationCounts()
  // The list counts as unread while the store loads; that is not a failure yet.
  const storeDataSettled = useStoreDataSettled()
  const recommendationCountsReadFailed =
    useRecommendationCountsReadFailed() && storeDataSettled
  const recommendationCountsReading = useRecommendationCountsReading()
  const recommendationsLoading =
    !storeDataSettled || recommendationCountsReading
  const { reloadRecommendations } = useShelfLayoutActions()
  const skuById = useSkuById()
  const stockBoard = useStockBoard()
  const restockRequest = useRestockRequest()
  const { focusedCell, selectedCell, selectedCellScrollSignal } =
    useShelfSelection()
  const restockingPlacement = useRestockingPlacement()
  const laneAdditions = useRestockingLaneAdditions()
  const misplacedStock = useMisplacedStock()
  const selectedStore = useSelectedStore()
  const busyAction = useBusyAction()
  const stockDrinkRemoval = useStockDrinkRemoval()
  const requestRestockingStart = useRequestRestockingStart()
  const requestRestockingEnd = useRequestRestockingEnd()
  const { checkLaneMatched } = useLaneMatchCheck()
  const errorLaneIds = useErrorLaneIds()
  const laneDrawer = useLaneDrawer()

  useVisibleRefresh(refreshRequests)
  useShelfReadOnOpen()
  useRestockingResumeOnEntry()
  useRestockingScannedSkuRestore()
  useErrorLaneGuide()

  return (
    <>
      <RestockingBoardView
        robotArm={robotArm}
        agedStockRule={getAgedStockRule(selectedStore)}
        board={stockBoard}
        busyAction={busyAction}
        errorLaneIds={errorLaneIds}
        isMisplacedSku={(skuId) => misplacedStock.skuIds.has(skuId)}
        laneAddedCounts={laneAdditions.countsByLaneId}
        laneDrawerId={laneDrawer.laneDrawerId}
        laneMarks={laneDrawer.laneMarks}
        laneSwitchPromptOpen={laneDrawer.switchPromptOpen}
        lastAddedLaneId={laneAdditions.lastLaneId}
        misplacedLaneIds={misplacedStock.laneIds}
        recommendations={recommendationCounts}
        recommendationsLoading={recommendationsLoading}
        recommendationsReadFailed={recommendationCountsReadFailed}
        removalBlock={stockDrinkRemoval.block}
        restockingPlacement={restockingPlacement}
        restockRequest={restockRequest}
        focusedCell={focusedCell}
        selectedCell={selectedCell}
        selectedCellScrollSignal={selectedCellScrollSignal}
        skuById={skuById}
        onCancelLaneSwitch={laneDrawer.cancelLaneSwitch}
        onCheckLaneMatched={checkLaneMatched}
        onCloseLane={laneDrawer.closeLane}
        onEndRestocking={requestRestockingEnd}
        onFinishLaneRemoval={(locationId, removals) =>
          void laneDrawer.finishRemoval(locationId, removals)
        }
        onLaneMarksChange={laneDrawer.setLaneMarks}
        onOpenLane={laneDrawer.openLane}
        onReloadRecommendations={() => void reloadRecommendations()}
        onRemoveSku={stockDrinkRemoval.removeSku}
        onRequestCloseLane={laneDrawer.requestCloseLane}
        onStartRestocking={requestRestockingStart}
      />
      <LaneErrorDialog />
      {/* The pause itself is sent by useRestockingSessionTracking. */}
      <LeaveConfirmDialog
        cancelLabel={t("common:boolean.no")}
        confirmLabel={t("common:boolean.yes")}
        message={t("restockingLeaveConfirm")}
        shouldBlock={isRestockInProgress}
      />
    </>
  )
}

function isRestockInProgress(): boolean {
  return isRequestInProgress(selectRestockRequest(readOperationsState()))
}
