import { useCallback, useState } from "react"

import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"

import { ConfirmDialog } from "~/components/dialog/confirm-dialog"
import { MessageDialog } from "~/components/dialog/message-dialog"
import { ROUTES } from "~/config/routes"
import { useBusyAction } from "~/domains/app-shell"
import { acknowledgeMisplacedStockForNextEntry } from "~/domains/restocking"
import {
  beginRobotStopWatch,
  endRobotStopWatch,
  useRobotActions,
  useRobotStatusStale,
  useRobotWorkStatus,
} from "~/domains/robot"
import {
  useDisplayLayoutDraft,
  useDisplayLocations,
  useDisplaySpec,
  useLayoutFreshnessWatch,
  useShelfLayoutActions,
  useShelfSelection,
  useSkuById,
  useSkus,
  useStoreMirrored,
} from "~/domains/shelf"
import {
  useSelectedRobotId,
  useSelectedStoreId,
} from "~/domains/store-selection"
import { useOnlineStatus } from "~/hooks/use-online-status"
import { getRobotControls } from "~/model/robot-status"
import { LayoutEditorView } from "~/views/shelf/layout-editor"

import { useLayoutProductScan } from "../_hooks/use-layout-product-scan"
import { useEditEntry } from "./_hooks/use-edit-entry"

export default function EditPage() {
  const { t } = useTranslation(["app", "common"])
  const selectedStoreId = useSelectedStoreId()
  const isOnline = useOnlineStatus()
  const [scanEnabled, setScanEnabled] = useState(false)
  const [productScan, setProductScan] = useState<{
    code: string
    sequence: number
  } | null>(null)
  const onProductScan = useCallback((code: string) => {
    setProductScan((previous) => ({
      code,
      sequence: (previous?.sequence ?? 0) + 1,
    }))
  }, [])
  useLayoutProductScan({ enabled: scanEnabled, onScan: onProductScan })
  const {
    draftStorage,
    pendingDisplayLayout,
    pendingDisplayLayoutIssue,
    pendingDisplayLayoutNeedCapture,
    editedDisplayBoard,
    editedDisplayLocations,
    setEditedDisplayLocations,
  } = useDisplayLayoutDraft()
  const displayLocations = useDisplayLocations()
  const displaySpec = useDisplaySpec()
  const storeMirrored = useStoreMirrored()
  const skuById = useSkuById()
  const skus = useSkus()
  const { selectCell } = useShelfSelection()
  const busyAction = useBusyAction()
  const {
    isBaseLayoutCurrent,
    reloadLatestLayout,
    sendLayoutChange,
    refreshLayoutStatus,
  } = useShelfLayoutActions()
  const { startAutoPnpOperation } = useRobotActions()
  const navigate = useNavigate()
  const entry = useEditEntry(Boolean(pendingDisplayLayout))
  const [layoutStale, setLayoutStale] = useState(false)

  const { canStop: robotWillStop } = getRobotControls({
    workStatus: useRobotWorkStatus(),
    // Whether sending parks a moving robot, not whether Stop is offered.
    operationMode: "",
    hasRobot: Boolean(useSelectedRobotId()),
    isOnline: useOnlineStatus(),
    statusStale: useRobotStatusStale(),
    robotOperating: false,
    sessionInProgress: false,
  })

  useLayoutFreshnessWatch(isBaseLayoutCurrent, () => {
    if (entry.state === "ready" && !pendingDisplayLayout) {
      setLayoutStale(true)
    }
  })

  async function reloadLatest() {
    draftStorage.clear()
    await reloadLatestLayout().catch(() => undefined)
  }

  if (entry.state !== "ready") {
    return (
      <>
        <MessageDialog
          message={t("layoutRequestLocked")}
          okLabel={t("common:actions.ok")}
          open={entry.state === "pending-locked"}
          onClose={entry.goHome}
        />
        <ConfirmDialog
          busy={busyAction === "cancel-layout-request"}
          cancelLabel={t("layoutReturnHome")}
          confirmLabel={t("layoutRequestCancelAndEdit")}
          extraLabel={
            entry.canResendPending ? t("layoutRequestFixAndResend") : undefined
          }
          message={t("layoutRequestPending")}
          open={entry.state === "pending-cancellable"}
          onCancel={entry.goHome}
          onConfirm={() => {
            void entry.cancelPendingAndEdit(false)
          }}
          onExtra={() => {
            void entry.cancelPendingAndEdit(true)
          }}
        />
      </>
    )
  }

  return (
    <>
      <LayoutEditorView
        key={selectedStoreId}
        productScan={productScan}
        onScanEnabledChange={setScanEnabled}
        hasPendingSubmission={Boolean(pendingDisplayLayout)}
        pendingIssue={pendingDisplayLayoutIssue}
        pendingNeedRobotCapture={pendingDisplayLayoutNeedCapture}
        isOnline={isOnline}
        board={editedDisplayBoard}
        busyAction={busyAction}
        editedDisplayLocations={editedDisplayLocations}
        initialDisplayLocations={displayLocations}
        mirrored={storeMirrored}
        robotWillStop={robotWillStop}
        spec={displaySpec}
        skuById={skuById}
        skus={skus}
        draftStorage={draftStorage}
        sendHandlers={{
          onCheckLayoutCurrent: isBaseLayoutCurrent,
          onReloadLatest: reloadLatest,
          // Sending parks a moving robot first: watch it to the stop
          // position (the popup), unless the send stops short.
          onSendLayoutChange: async (needRobotCapture) => {
            if (robotWillStop) beginRobotStopWatch({ shelves: false })
            const outcome = await sendLayoutChange(needRobotCapture)
            if (
              outcome.kind === "failed" ||
              outcome.kind === "robot-not-resting"
            )
              endRobotStopWatch()
            return outcome
          },
          onRefreshLayoutStatus: refreshLayoutStatus,
          onReturnHome: async () => {
            const restarted = await startAutoPnpOperation()
            if (restarted) {
              void navigate(ROUTES.home().pathname)
            }
            return restarted
          },
          // The operator starts it there, as in the store app.
          onOpenRestocking: (leftoverStockAcknowledged) => {
            if (leftoverStockAcknowledged)
              acknowledgeMisplacedStockForNextEntry()
            void navigate(ROUTES.restocking().pathname)
          },
          onLeave: () => {
            void navigate(ROUTES.home().pathname)
          },
        }}
        onLocationsChange={(locations) => {
          setEditedDisplayLocations(locations)
          selectCell(null)
        }}
      />
      <MessageDialog
        message={t("layoutForegroundStale")}
        okLabel={t("layoutReloadLatest")}
        open={layoutStale}
        onClose={() => {
          setLayoutStale(false)
          void reloadLatest()
        }}
      />
    </>
  )
}
