import { useEffect, useState } from "react"

import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"

import { ConfirmDialog } from "~/components/dialog/confirm-dialog"
import { FinishWorkDialog } from "~/components/dialog/finish-work-dialog"
import { MessageDialog } from "~/components/dialog/message-dialog"
import { FEATURES } from "~/config/feature"
import { ROUTES } from "~/config/routes"
import {
  applyAppUpdate,
  reconnectToOpm,
  useActionPrompt,
  useActiveDialog,
  useAppShellStore,
  useAppUpdateReady,
  useBusyAction,
  useOpmConnection,
  useShellMessage,
  useVideoTutorialCategory,
  type ActionPrompt,
  type DialogKind,
  type PromptChoice,
} from "~/domains/app-shell"
import {
  useManualReplenishmentRequest,
  useRestockRequest,
} from "~/domains/operations"
import {
  useRequestManualStart,
  useRestockingActions,
  useShelvesFlat,
} from "~/domains/restocking"
import { useRobotOperationMode, useRobotWorkStatus } from "~/domains/robot"
import { useSession } from "~/domains/session"
import { useSelectedRobotId } from "~/domains/store-selection"
import { isRequestInProgress } from "~/model/request-state"
import { getRobotLock } from "~/model/robot-status"
import type { BusyAction } from "~/types/busy-action"
import { ManualReplenishmentStartDialog } from "~/views/restocking/manual-replenishment-start-dialog"
import { RestockingStartDialog } from "~/views/restocking/restocking-start-dialog"
import { ShelfMovingDialog } from "~/views/restocking/shelf-moving-dialog"
import { DisplayReservationBlockedDialog } from "~/views/shelf/display-reservation-blocked-dialog"
import { ActionPromptDialog } from "~/views/store/action-prompt-dialog"
import { AppUpdateBannerView } from "~/views/store/app-update-banner"
import { ConnectingDialog } from "~/views/store/connecting-dialog"
import { PwaInstallPromptView } from "~/views/store/pwa-install-prompt"
import { RobotLockView } from "~/views/store/robot-lock"
import { ScannerRecoveryDialog } from "~/views/store/scanner-recovery-dialog"
import { VideoTutorialDialog } from "~/views/store/video-tutorial-dialog"

import { useRobotRunning } from "../_hooks/use-robot-running"
import { useVideoTutorialCatalog } from "../_hooks/use-video-tutorial-catalog"
import { RobotPowerHost } from "./robot-power-host"
import { ScanAlertDialog } from "./scan-alert-dialog"

/** The app-wide dialog host: decides which dialog is open and what its buttons do. */
export function AppDialogs() {
  const { t } = useTranslation(["app", "common"])
  const session = useSession()
  const busyAction = useBusyAction()
  const message = useShellMessage()
  const activeDialog = useActiveDialog()
  const [continuation, setContinuation] = useState<"manual" | "restock" | null>(
    null
  )
  useEffect(() => setContinuation(null), [activeDialog])
  const restockRequest = useRestockRequest()
  const manualTaskInProgress = isRequestInProgress(
    useManualReplenishmentRequest()
  )
  const prompt = useActionPrompt()
  const robotLock = getRobotLock(useRobotOperationMode(), useRobotWorkStatus())
  const opmConnection = useOpmConnection()
  const appUpdateReady = useAppUpdateReady()
  const hasRobot = Boolean(useSelectedRobotId())
  const shelvesFlat = useShelvesFlat()

  const pendingManualTaskPromptId = useAppShellStore(
    (state) => state.pendingManualTaskPromptId
  )
  const answerPrompt = useAppShellStore((state) => state.answerPrompt)
  const clearMessage = useAppShellStore((state) => state.clearMessage)
  const closeDialog = useAppShellStore((state) => state.closeDialog)
  const dismissManualTaskPrompt = useAppShellStore(
    (state) => state.dismissManualTaskPrompt
  )

  const {
    cancelRestockingStart,
    continueToManualReplenishment,
    continueToRestocking,
    endManualReplenishment,
    endRestocking,
    startManualReplenishment,
    startRestocking,
  } = useRestockingActions()
  const requestManualStart = useRequestManualStart()
  const robotRunning = useRobotRunning()
  const navigate = useNavigate()
  const videoTutorialOpen = activeDialog === "video-tutorial"
  const videoTutorialCatalog = useVideoTutorialCatalog(videoTutorialOpen)
  const videoTutorialCategory = useVideoTutorialCategory()

  // /login mounts this too, with no store to act on.
  const signedIn = Boolean(session)

  function closeAndNavigate(dialog: DialogKind, target: string) {
    closeDialog(dialog)
    void navigate(target)
  }

  function answerActionPrompt(choice: PromptChoice) {
    if (!prompt) {
      return
    }
    answerPrompt(choice)
    const target = getPromptTarget(prompt, choice)
    if (target) {
      closeDialog()
      void navigate(target.pathname)
    }
    if (prompt.buttons === "return-to-manual" && choice === "confirm") {
      void requestManualStart()
    }
  }

  return (
    <>
      {signedIn && (
        <>
          <ManualReplenishmentStartDialog
            busy={Boolean(busyAction)}
            stopsRobot={robotRunning}
            open={activeDialog === "manual-start" || continuation === "restock"}
            onCancel={() =>
              continuation ? setContinuation(null) : closeDialog("manual-start")
            }
            onConfirm={() => {
              if (continuation === "restock") {
                void continueToManualReplenishment().then((started) => {
                  if (started) {
                    setContinuation(null)
                    void navigate(ROUTES.manual().pathname)
                  }
                })
              } else {
                void startManualReplenishment().then((started) => {
                  if (started) void navigate(ROUTES.manual().pathname)
                })
              }
            }}
          />
          <FinishWorkDialog
            mode="manual"
            busy={Boolean(busyAction)}
            open={activeDialog === "manual-finish" && !continuation}
            onCancel={() => closeDialog("manual-finish")}
            onContinue={() => setContinuation("manual")}
            onFinish={() => {
              void endManualReplenishment().then((ended) => {
                if (ended) void navigate(ROUTES.home().pathname)
              })
            }}
          />
          <RestockingStartDialog
            busy={Boolean(busyAction)}
            stopsRobot={robotRunning}
            open={
              activeDialog === "restocking-start" || continuation === "manual"
            }
            resuming={!continuation && Boolean(restockRequest)}
            shelvesFlat={shelvesFlat}
            onCancel={() =>
              continuation ? setContinuation(null) : cancelRestockingStart()
            }
            onConfirm={() => {
              if (continuation === "manual") {
                void continueToRestocking().then((started) => {
                  if (started) {
                    setContinuation(null)
                    void navigate(ROUTES.restocking().pathname)
                  }
                })
              } else void startRestocking()
            }}
          />
          <FinishWorkDialog
            mode="restock"
            canContinue={
              FEATURES.endRestockingGoToManualReplenishment && hasRobot
            }
            busy={Boolean(busyAction)}
            open={activeDialog === "restocking-end" && !continuation}
            onCancel={() => closeDialog("restocking-end")}
            onContinue={() => setContinuation("restock")}
            onFinish={() => {
              void endRestocking().then((ended) => {
                if (ended) void navigate(ROUTES.home().pathname)
              })
            }}
          />
          <ShelfMovingDialog
            open={isShelfMoving(busyAction) && !prompt && !message}
          />
          {/* One popup at a time: waits behind any open prompt or message. */}
          <ScanAlertDialog blocked={Boolean(message || prompt)} />
          <PwaInstallPromptView />
        </>
      )}

      {/* Signed out too: /login is where an idle tablet often sits. */}
      <AppUpdateBannerView
        open={appUpdateReady}
        onReload={() => applyAppUpdate("operator")}
      />

      <VideoTutorialDialog
        catalog={videoTutorialCatalog.catalog}
        catalogState={videoTutorialCatalog.state}
        category={videoTutorialCategory}
        open={videoTutorialOpen}
        onClose={() => closeDialog("video-tutorial")}
      />
      <ScannerRecoveryDialog
        open={activeDialog === "scanner-recovery"}
        onClose={() => closeDialog("scanner-recovery")}
      />
      <MessageDialog
        message={message}
        okLabel={t("common:actions.ok")}
        open={Boolean(message)}
        onClose={clearMessage}
      />
      <ActionPromptDialog prompt={prompt} onAnswer={answerActionPrompt} />
      <ConfirmDialog
        cancelLabel={t("common:actions.close")}
        confirmLabel={t("returnToManualReplenishment")}
        message={t(
          manualTaskInProgress
            ? "manualTaskOpenNotice"
            : "manualTaskPreparingNotice"
        )}
        open={Boolean(pendingManualTaskPromptId)}
        onCancel={dismissManualTaskPrompt}
        onConfirm={() => {
          dismissManualTaskPrompt()
          void navigate(ROUTES.manual().pathname)
          void requestManualStart()
        }}
      />

      {signedIn && (
        <>
          <DisplayReservationBlockedDialog
            block={getDisplayReservationBlock(activeDialog)}
            onClose={() => closeDialog(activeDialog ?? undefined)}
          />
          <ConfirmDialog
            cancelLabel={t("common:actions.close")}
            confirmLabel={t("goToRestocking")}
            message={t("layoutRestockingInProgressBlock")}
            open={activeDialog === "restocking-layout-block"}
            onCancel={() => closeDialog("restocking-layout-block")}
            onConfirm={() =>
              closeAndNavigate(
                "restocking-layout-block",
                ROUTES.restocking().pathname
              )
            }
          />
          <ConfirmDialog
            cancelLabel={t("common:actions.close")}
            confirmLabel={t("returnToManualReplenishment")}
            message={t("layoutManualInProgressBlock")}
            open={activeDialog === "manual-layout-block"}
            onCancel={() => closeDialog("manual-layout-block")}
            onConfirm={() =>
              closeAndNavigate("manual-layout-block", ROUTES.manual().pathname)
            }
          />
          <MessageDialog
            message={t("layoutTeleoperationBlock")}
            okLabel={t("common:actions.ok")}
            open={activeDialog === "teleoperation-layout-block"}
            onClose={() => closeDialog("teleoperation-layout-block")}
          />
          <RobotPowerHost />
          <RobotLockView lock={robotLock} />
          {/* Last, so it covers every dialog above while OPM is unreachable. */}
          <ConnectingDialog
            failed={opmConnection === "failed"}
            open={opmConnection !== "connected"}
            onReconnect={reconnectToOpm}
          />
        </>
      )}
    </>
  )
}

function getDisplayReservationBlock(dialog: DialogKind | null) {
  if (dialog === "display-source-blocked") {
    return "source-blocked"
  }
  if (dialog === "display-source-not-enough") {
    return "source-not-enough"
  }
  return null
}

function isEndingRestocking(busyAction: BusyAction): boolean {
  return (
    busyAction === "end-restocking" || busyAction === "end-restocking-to-manual"
  )
}

/** Restocking's and manual replenishment's Start and End tilt the shelves. */
function isShelfMoving(busyAction: BusyAction): boolean {
  if (busyAction === "start-manual" || busyAction === "end-manual") {
    return true
  }
  return busyAction === "start-restocking" || isEndingRestocking(busyAction)
}

const PROMPT_TARGETS: Partial<
  Record<ActionPrompt["buttons"], () => { pathname: string }>
> = {
  "return-to-manual": ROUTES.manual,
  "to-restocking": ROUTES.restocking,
  "to-restocking-or-close": ROUTES.restocking,
  "notification-to-edit": ROUTES.edit,
  "notification-to-restocking": ROUTES.restocking,
  "notification-to-home": ROUTES.home,
}

function getPromptTarget(prompt: ActionPrompt, choice: PromptChoice) {
  if (choice === "confirm") {
    return PROMPT_TARGETS[prompt.buttons]?.() ?? null
  }
  return prompt.home ? ROUTES.home() : null
}
