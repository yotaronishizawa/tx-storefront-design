import { useEffect, useState } from "react"

import { useTranslation } from "react-i18next"
import { useNavigate, useSearchParams } from "react-router"

import { isRestockStudy } from "~/config/restock-study"
import { ROUTES } from "~/config/routes"
import {
  readAppShellState,
  setIdleScreenEnabled,
  setIdleScreenShown,
  useBusyAction,
  useIdleScreenEnabled,
  useIdleTimeoutMs,
  useShellIdle,
} from "~/domains/app-shell"
import {
  getActionPrompt,
  readOperationsState,
  resumeRobotUnlessHeld,
  runBusy,
  useManualReplenishmentRequest,
  useRestockRequest,
  useRobotResumeFailure,
} from "~/domains/operations"
import { useRequestManualStart } from "~/domains/restocking"
import {
  useAutoPnpOperating,
  useRobotActions,
  useRobotAttention,
  useRobotOperationMode,
  useRobotStatusStale,
  useRobotWorkStatus,
} from "~/domains/robot"
import { useSelectedRobotId, useSelectedStore } from "~/domains/store-selection"
import { useInactiveFor } from "~/hooks/use-inactive-for"
import { useOnlineStatus } from "~/hooks/use-online-status"
import { isActiveRequest } from "~/model/request-state"
import type { RobotAttentionCause } from "~/model/robot-attention"
import { hasShelfClient } from "~/model/store-display"
import { HomeDashboardView } from "~/views/store/home-dashboard"

import { useOpenEditLayout } from "../_hooks/use-open-edit-layout"
import { useOpenRestocking } from "../_hooks/use-open-restocking"
import { useRobotRunning } from "../_hooks/use-robot-running"

/** Home has been shown since the page loaded. */
let homeShownSinceLoad = false

export default function HomePage() {
  const selectedRobotId = useSelectedRobotId()
  const manualReplenishmentRequest = useManualReplenishmentRequest()
  const restockRequest = useRestockRequest()
  const autoPnpOperating = useAutoPnpOperating()
  const robotWorkStatus = useRobotWorkStatus()
  const robotOperationMode = useRobotOperationMode()
  const busyAction = useBusyAction()
  const isOnline = useOnlineStatus()
  const robotStatusStale = useRobotStatusStale()
  const attention = useRobotAttention()
  const robotActions = useRobotActions()
  const resumeFailure = useRobotResumeFailure()
  // The same message the resume popup shows for this reason (as in the Unity app).
  const resumeMessage = resumeFailure
    ? getActionPrompt(
        "start-auto-pnp",
        resumeFailure === "Unreachable"
          ? { kind: "thrown", cause: new Error("Unreachable") }
          : {
              kind: "failed",
              codes: [],
              error: resumeFailure,
              stopRobotError: "",
            },
        1
      ).message
    : ""
  const [searchParams, setSearchParams] = useSearchParams()
  // The idle screen: after Home sits untouched with nothing open, for the
  // time chosen in Settings. Only a touch on it (or a key, e.g. the scanner)
  // wakes Home. Study: `?idle=1` shows it at once.
  // Staff may study the attention panel's camera images without touching,
  // so the count waits while it is open and starts afresh once it closes.
  // Study: `?idleScreen=off` / `on` switches between Home with the robot
  // status (no idle screen) and the idle screen version; Settings keeps it.
  const idleScreenParam = searchParams.get("idleScreen")
  useEffect(() => {
    if (idleScreenParam === "on" || idleScreenParam === "off")
      setIdleScreenEnabled(idleScreenParam === "on")
  }, [idleScreenParam])
  const idleScreenEnabled = useIdleScreenEnabled()
  const idleTimeoutMs = useIdleTimeoutMs()
  const shellIdle = useShellIdle()
  const [attentionPanelOpen, setAttentionPanelOpen] = useState(false)
  const inactive = useInactiveFor(
    idleTimeoutMs,
    attentionPanelOpen || !idleScreenEnabled
  )
  // A fresh load (the tablet waking, a reload) opens on the idle screen;
  // coming back to Home from a task does not.
  const [idle, setIdle] = useState(
    () => searchParams.get("idle") === "1" || !homeShownSinceLoad
  )
  useEffect(() => {
    homeShownSinceLoad = true
  }, [])
  // Turning the idle screen off (in Settings or by the study switch) closes it.
  const [idleScreenWasEnabled, setIdleScreenWasEnabled] =
    useState(idleScreenEnabled)
  if (idleScreenWasEnabled !== idleScreenEnabled) {
    setIdleScreenWasEnabled(idleScreenEnabled)
    if (!idleScreenEnabled) setIdle(false)
  }
  useEffect(() => {
    if (inactive && shellIdle) setIdle(true)
  }, [inactive, shellIdle])
  const idleShown = idle && idleScreenEnabled
  useEffect(() => {
    setIdleScreenShown(idleShown)
    return () => setIdleScreenShown(false)
  }, [idleShown])
  // The header's "see the robot" asks with `?idle=1` while Home is open.
  const idleAsked = searchParams.get("idle") === "1"
  useEffect(() => {
    if (!idleAsked) return
    if (idleScreenEnabled) setIdle(true)
    setSearchParams(
      (current) => {
        current.delete("idle")
        return current
      },
      { replace: true }
    )
  }, [idleAsked, idleScreenEnabled, setSearchParams])
  useEffect(() => {
    if (!idle) return
    const wake = () => setIdle(false)
    window.addEventListener("keydown", wake)
    return () => window.removeEventListener("keydown", wake)
  }, [idle])
  const navigate = useNavigate()
  const { t } = useTranslation("app")
  const openEditLayout = useOpenEditLayout()
  const openRestocking = useOpenRestocking()
  // The drinks-to-restock list exists only in the restock study.
  const [stockListShown] = useState(isRestockStudy)
  const requestManualStart = useRequestManualStart()
  const robotRunning = useRobotRunning()
  const manualReplenishmentAvailable = hasShelfClient(useSelectedStore())
  function showManualReplenishment() {
    if (isActiveRequest(manualReplenishmentRequest)) {
      void navigate(ROUTES.manual().pathname)
      return
    }
    void requestManualStart()
  }
  // Going in to clear a detection: the store stops the robot too, so it
  // stays stopped until staff restart it, not only until the detection
  // clears. Home stays on the panel, camera images and all; the restart is
  // held as after a task, so "Try again" brings the robot back.
  const [holdingFor, setHoldingFor] = useState<RobotAttentionCause | null>(null)
  const holdPhase =
    holdingFor !== null && holdingFor === attention?.cause
      ? robotWorkStatus === "RestPosition" &&
        robotOperationMode === "StoppedByStore"
        ? "held"
        : "holding"
      : null
  async function holdForWalkIn() {
    const detector = attention?.cause
    if (detector !== "obstacle") return
    if (!(await robotActions.stopAutoPnpOperation(true))) return
    readOperationsState().setRestartHeldBy(detector)
    setHoldingFor(detector)
  }

  // Going in stops the robot, so ask on Home first; the walk-in screen then
  // opens already stopping it.
  async function enterWalkIn() {
    // Asked only when there is a robot to stop; a parked one just goes in.
    if (!robotRunning) {
      void navigate(`${ROUTES.walkIn().pathname}?start=1`)
      return
    }
    const choice = await readAppShellState().askOperator({
      buttons: "stop-and-enter",
      home: false,
      message: t("workflow.walkIn.stopConfirm"),
    })
    if (choice === "confirm")
      void navigate(`${ROUTES.walkIn().pathname}?start=1`)
  }

  return (
    <HomeDashboardView
      busyAction={busyAction}
      isOnline={isOnline}
      manualReplenishmentAvailable={manualReplenishmentAvailable}
      manualReplenishmentRequest={manualReplenishmentRequest}
      restockRequest={restockRequest}
      robotId={selectedRobotId}
      robotOperating={autoPnpOperating}
      robotOperationMode={robotOperationMode}
      robotStatusStale={robotStatusStale}
      robotWorkStatus={robotWorkStatus}
      attention={attention}
      resumeMessage={resumeMessage}
      onRetryRestart={() =>
        runBusy("start-auto-pnp", () => resumeRobotUnlessHeld(1))
      }
      onRobotAction={() =>
        void (attention?.cause === "teleopFixable"
          ? robotActions.stopRobot()
          : robotActions.startRobot())
      }
      onEnterWalkIn={() => void enterWalkIn()}
      holdPhase={holdPhase}
      onHoldForWalkIn={() => void holdForWalkIn()}
      onShowDisplay={() => navigate(ROUTES.display().pathname)}
      onShowEdit={openEditLayout}
      onShowManualReplenishment={showManualReplenishment}
      onShowRecommendations={() => navigate(ROUTES.recommendations().pathname)}
      onShowRestocking={openRestocking}
      onShowStock={
        // Federico's restocking screen as it is before starting (Yotaro 2026-11-04).
        stockListShown
          ? () => navigate(ROUTES.restocking().pathname)
          : undefined
      }
      idle={idle && idleScreenEnabled}
      idleScreenEnabled={idleScreenEnabled}
      onWake={() => setIdle(false)}
      onAttentionPanelChange={setAttentionPanelOpen}
    />
  )
}
