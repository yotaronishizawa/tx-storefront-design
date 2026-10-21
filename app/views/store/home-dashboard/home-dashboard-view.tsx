import { useEffect, useRef, useState } from "react"

import { Power } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router"

import type { RequestContext } from "~/api/opm/schemas"
import { Button, ChoiceCard } from "~/core"
import { isActiveRequest, isRequestInProgress } from "~/model/request-state"
import type {
  RobotAttention,
  RobotAttentionCause,
  RobotEStop,
} from "~/model/robot-attention"
import {
  getRobotControls,
  type OperationMode,
  type WorkStatus,
} from "~/model/robot-status"
import type { BusyAction } from "~/types/busy-action"
import { cn } from "~/utils/cn"

import {
  HomeAttentionPanel,
  HomeRecoveredPanel,
  RECOVERED_SECONDS,
} from "./components/home-attention-panel"
import { HomeEStopDialog } from "./components/home-estop-dialog"
import { HomeIdleScreen } from "./components/home-idle-screen"
import { HomeMoreActions } from "./components/home-more-actions"
import { HomeObjectAction } from "./components/home-object-action"
import { HomeRobotStatus } from "./components/home-robot-status"

export function HomeDashboardView({
  busyAction,
  isOnline,
  manualReplenishmentAvailable,
  manualReplenishmentRequest,
  restockRequest,
  robotId,
  robotOperating,
  robotOperationMode,
  robotStatusStale,
  robotWorkStatus,
  attention,
  resumeMessage,
  onRobotAction,
  onRetryRestart,
  onEnterWalkIn,
  holdPhase,
  onHoldForWalkIn,
  onShowDisplay,
  onShowEdit,
  onShowRecommendations,
  onShowRestocking,
  onShowManualReplenishment,
  idle,
  idleScreenEnabled,
  onWake,
  onAttentionPanelChange,
}: {
  busyAction: BusyAction
  isOnline: boolean
  manualReplenishmentAvailable: boolean
  manualReplenishmentRequest?: RequestContext
  restockRequest?: RequestContext
  robotId: string
  robotOperating: boolean
  robotOperationMode: OperationMode
  robotStatusStale: boolean
  robotWorkStatus: WorkStatus
  attention?: RobotAttention
  /** Why the app's own robot restart failed, translated; empty otherwise. */
  resumeMessage: string
  /** Start, resume, or check and stop, as the attention cause asks. */
  onRobotAction: () => void
  /** Restart the robot once, after staff clear a detector stop that held a restart. */
  onRetryRestart: () => Promise<unknown>
  onEnterWalkIn: () => void
  /** Stopping the robot for staff to go in and clear a detection, and then stopped. */
  holdPhase: "holding" | "held" | null
  onHoldForWalkIn: () => void
  onShowDisplay: () => void
  onShowEdit: () => void
  onShowRecommendations: () => void
  onShowRestocking: () => void
  onShowManualReplenishment: () => void
  /** Home has sat untouched: show the idle screen over it. */
  idle: boolean
  /** Off: no idle screen, and Home shows the robot status beside the actions. */
  idleScreenEnabled: boolean
  onWake: () => void
  /** The attention panel (or its "recovered" note) opened or closed. */
  onAttentionPanelChange: (open: boolean) => void
}) {
  const { t } = useTranslation("app")
  const cause = attention?.cause ?? null
  const assist = attention?.level === "assist"
  // A blocking cause takes over until "Do something else" sets it aside; an
  // assist cause stays a bar until staff open it. Either way a new cause starts over.
  const [setAside, setSetAside] = useState<RobotAttentionCause | null>(null)
  const [opened, setOpened] = useState<RobotAttentionCause | null>(null)
  // Closed for one e-stop state; "needs a restart" after "pressed" reopens it.
  const [eStopClosed, setEStopClosed] = useState<RobotEStop | null>(null)
  // Once it clears, the same cause coming back is a new one: show it again.
  if (
    cause === null &&
    (setAside !== null || opened !== null || eStopClosed !== null)
  ) {
    setSetAside(null)
    setOpened(null)
    setEStopClosed(null)
  }
  // The emergency stop is a popup, not a takeover: nothing here fixes it.
  const eStopCause = cause === "eStop"
  const showAttention =
    cause !== null &&
    !eStopCause &&
    (assist ? opened === cause : setAside !== cause)
  const eStopDialogOpen =
    eStopCause && eStopClosed !== (attention?.eStop ?? null) && !idle
  // Nothing that moves the robot can work while an e-stop or a detector holds it.
  const robotHeld = cause !== null && !assist && cause !== "resumeFailed"
  const [retryState, setRetryState] = useState<"idle" | "checking" | "still">(
    "idle"
  )
  const causeRef = useRef(cause)
  useEffect(() => {
    causeRef.current = cause
  }, [cause])
  useEffect(() => setRetryState("idle"), [cause])
  async function retryRestart() {
    const before = cause
    setRetryState("checking")
    await onRetryRestart()
    // Give the robot a moment to move, or to be stopped again by its detectors.
    await new Promise((resolve) => window.setTimeout(resolve, RETRY_SETTLE_MS))
    setRetryState(causeRef.current === before ? "still" : "idle")
  }
  const recovered = useRecoveredFlash(cause)
  const panelOpen = recovered || showAttention || eStopDialogOpen
  useEffect(() => {
    onAttentionPanelChange(panelOpen)
  }, [panelOpen, onAttentionPanelChange])
  // A second quick tap on the idle screen would land on whatever sits under
  // it on Home; hold taps for a moment after waking.
  const [wakeShield, setWakeShield] = useState(false)
  useEffect(() => {
    if (!wakeShield) return
    const timer = window.setTimeout(() => setWakeShield(false), WAKE_SHIELD_MS)
    return () => window.clearTimeout(timer)
  }, [wakeShield])
  // Study: `?runningPreview=1` shows both cards in progress without starting a task.
  const [searchParams] = useSearchParams()
  const runningPreview = searchParams.get("runningPreview") === "1"
  // With the idle screen on, the robot status lives only there: staff look at
  // it for reassurance, not to decide anything, so Home gives the width to
  // actions. With it off, Home shows the status beside them (the version to
  // compare in the usability test).
  const restockOpen = runningPreview || isActiveRequest(restockRequest)
  const manualOpen =
    runningPreview || isActiveRequest(manualReplenishmentRequest)
  const controls = getRobotControls({
    workStatus: robotWorkStatus,
    operationMode: robotOperationMode,
    hasRobot: Boolean(robotId),
    isOnline,
    statusStale: robotStatusStale,
    robotOperating,
    sessionInProgress:
      isRequestInProgress(restockRequest) ||
      isRequestInProgress(manualReplenishmentRequest),
  })
  const available = Boolean(robotId) && isOnline && !robotStatusStale
  const busy = Boolean(busyAction)
  return (
    <div
      className={cn(
        "relative grid min-h-0 min-w-0 flex-1 grid-cols-1 overflow-y-auto bg-default",
        !idleScreenEnabled && "lg:grid-cols-[41%_minmax(0,1fr)]"
      )}
    >
      {!idleScreenEnabled && (
        <HomeRobotStatus
          kind={controls.kind}
          available={available}
          attention={attention}
        />
      )}
      {idle && (
        <HomeIdleScreen
          robotStatus={
            <HomeRobotStatus
              kind={controls.kind}
              available={available}
              attention={attention}
              wide
            />
          }
          attention={cause !== null}
          onWake={() => {
            setWakeShield(true)
            onWake()
          }}
        />
      )}
      {wakeShield && (
        <div aria-hidden="true" className="absolute inset-0 z-40" />
      )}
      <HomeEStopDialog
        open={eStopDialogOpen}
        eStop={attention?.eStop ?? null}
        onClose={() => setEStopClosed(attention?.eStop ?? null)}
      />
      {recovered ? (
        <HomeRecoveredPanel />
      ) : showAttention ? (
        <HomeAttentionPanel
          cause={cause}
          teleopError={attention?.teleopError ?? null}
          retryable={attention?.retryable ?? false}
          retryState={retryState}
          onRetry={() => void retryRestart()}
          resumeMessage={resumeMessage}
          busy={busy}
          onRobotAction={onRobotAction}
          holdPhase={holdPhase}
          onHoldForWalkIn={onHoldForWalkIn}
          cameras={attention?.cameras ?? []}
          onOtherWork={() => (assist ? setOpened(null) : setSetAside(cause))}
        />
      ) : (
        <section className="flex min-h-0 min-w-0 flex-col gap-3 p-4 lg:gap-4">
          {cause && (
            <div
              className={cn(
                "flex shrink-0 items-center justify-between gap-3 rounded-md px-4 py-2 text-sm font-bold",
                assist
                  ? "bg-primary-subtle text-primary-text"
                  : "bg-error-subtle text-error"
              )}
            >
              <span>
                {assist
                  ? t("workflow.home.assist.bar")
                  : `${t("workflow.home.attention.badge")}: ${t(
                      eStopCause && attention?.eStop === "needsReset"
                        ? "workflow.home.attention.eStopResetTitle"
                        : `workflow.home.cause.${cause}`
                    )}`}
                {robotHeld && (
                  <span className="block font-normal">
                    {t("workflow.home.attention.robotTasksHeld")}
                  </span>
                )}
              </span>
              <Button
                variant="unstyled"
                size="unstyled"
                type="button"
                className="shrink-0 underline underline-offset-4"
                onClick={() =>
                  assist
                    ? setOpened(cause)
                    : eStopCause
                      ? setEStopClosed(null)
                      : setSetAside(null)
                }
              >
                {t(
                  assist
                    ? "workflow.home.assist.open"
                    : eStopCause
                      ? "workflow.home.attention.showGuide"
                      : "workflow.home.attention.backToImages"
                )}
              </Button>
            </div>
          )}
          {/* The three whose steps stop the robot, said once at the top of a
              quiet panel. Layout change stops it later, at send, so it stays
              outside. Set apart by space as well as by the panel. */}
          <div className="mb-2 flex min-h-0 flex-col gap-3 rounded-xl bg-black/3 p-3 lg:flex-1">
            <p className="flex items-center gap-2 px-1 text-lg/tight text-secondary">
              <Power aria-hidden="true" className="size-5 shrink-0" />
              {t("workflow.home.stopsRobot")}
            </p>
            <div className="grid min-h-64 shrink-0 grid-cols-2 gap-3 lg:min-h-56 lg:flex-1 lg:gap-4">
              <HomeObjectAction
                kind="restock"
                label={t("workflow.home.restock")}
                inProgress={
                  restockOpen ? t("workflow.home.running.badge") : undefined
                }
                disabled={busy || robotHeld}
                onClick={onShowRestocking}
              />
              <HomeObjectAction
                kind="manual"
                label={t("workflow.home.manual")}
                inProgress={
                  manualOpen ? t("workflow.home.running.badge") : undefined
                }
                disabled={busy || robotHeld || !manualReplenishmentAvailable}
                onClick={onShowManualReplenishment}
              />
            </div>
            {/* Under the two cards so "above" points at them; the title
                says it all, so no hint. */}
            <ChoiceCard
              className="shrink-0"
              icon={
                <img
                  src="/assets/home-study-2026-10-06/enter.svg"
                  alt=""
                  draggable={false}
                  className="h-7 w-auto"
                />
              }
              title={t("workflow.home.enterWalkIn")}
              disabled={busy || robotHeld}
              onClick={onEnterWalkIn}
            />
          </div>
          <HomeMoreActions
            disabled={busy}
            actions={[
              {
                key: "layout",
                icon: "layout",
                title: t("workflow.home.layout"),
                disabled: busy || robotHeld,
                onClick: onShowEdit,
              },
              {
                key: "reservations",
                icon: "reservation",
                title: t("workflow.home.v5.reservations"),
                disabled: busy,
                onClick: onShowDisplay,
              },
              {
                key: "count",
                icon: "stock-count",
                title: t("workflow.home.count"),
                disabled: busy,
                onClick: onShowRecommendations,
              },
            ]}
          />
        </section>
      )}
    </div>
  )
}

// After an operator request the robot is stopped by staff or handled by the
// operator, so it has not necessarily resumed.
/** How long a restart gets to move the robot before "Try again" reports it still held. */
const RETRY_SETTLE_MS = 6000
/** How long taps are held after the idle screen wakes Home. */
const WAKE_SHIELD_MS = 400

const NO_FLASH_CAUSES: ReadonlySet<RobotAttentionCause> = new Set([
  "teleopFixable",
])

/** True for a few seconds after a cause clears, so staff see the robot carried on. */
function useRecoveredFlash(cause: RobotAttentionCause | null) {
  const [recovered, setRecovered] = useState(false)
  const previous = useRef(cause)
  useEffect(() => {
    const cleared =
      previous.current !== null &&
      !NO_FLASH_CAUSES.has(previous.current) &&
      cause === null
    previous.current = cause
    if (!cleared) return
    setRecovered(true)
    const timer = window.setTimeout(
      () => setRecovered(false),
      RECOVERED_SECONDS * 1000
    )
    return () => window.clearTimeout(timer)
  }, [cause])
  return recovered && cause === null
}
