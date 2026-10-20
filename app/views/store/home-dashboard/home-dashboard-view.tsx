import { useEffect, useRef, useState } from "react"

import { ChevronRight, Power } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router"

import type { RequestContext } from "~/api/opm/schemas"
import { Button } from "~/core"
import { isActiveRequest, isRequestInProgress } from "~/model/request-state"
import type {
  RobotAttention,
  RobotAttentionCause,
} from "~/model/robot-attention"
import {
  getRobotControls,
  type OperationMode,
  type WorkStatus,
} from "~/model/robot-status"
import type { BusyAction } from "~/types/busy-action"
import { cn } from "~/utils/cn"
import { readStorage, writeStorage } from "~/utils/local-storage"

import {
  HomeAttentionPanel,
  HomeRecoveredPanel,
} from "./components/home-attention-panel"
import { HomeIdleScreen } from "./components/home-idle-screen"
import { HomeMoreActions } from "./components/home-more-actions"
import { HomeObjectAction } from "./components/home-object-action"
import { HomeRobotStatus, type IdleLook } from "./components/home-robot-status"
import { HomeWalkInGate } from "./components/home-walk-in-gate"

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
  attentionStuck,
  resumeMessage,
  onRobotAction,
  onRetryRestart,
  onEnterWalkIn,
  onEnterWalkInDirect,
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
  /** The cause has not cleared for a while. */
  attentionStuck: boolean
  onEnterWalkIn: () => void
  /** Into the walk-in screen without asking again (the gate already said it stops the robot). */
  onEnterWalkInDirect: () => void
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
  const showAttention =
    cause !== null && (assist ? opened === cause : setAside !== cause)
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
  const panelOpen = recovered || showAttention
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
  // The idle screen is the signage look (2026-10-16). Study: `?idleLook=split`
  // / `ambient` / `headline` brings back the looks it was chosen from.
  const idleLookParam = searchParams.get("idleLook")
  const idleLook: IdleLook =
    idleLookParam === "split" ||
    idleLookParam === "ambient" ||
    idleLookParam === "headline"
      ? idleLookParam
      : "sign"
  // Study: `?homeLayout=gate` / `split` switches Home's layout and remembers
  // it on this tablet, so coming back from a task keeps the one on trial.
  const layoutParam = searchParams.get("homeLayout")
  if (
    layoutParam === "gate" ||
    layoutParam === "framed" ||
    layoutParam === "split"
  )
    writeStorage(HOME_LAYOUT_KEY, layoutParam)
  const storedLayout = readStorage(HOME_LAYOUT_KEY)
  const gateLayout = storedLayout === "gate"
  // `framed`: the walk-in actions boxed under "going in? pick here", with
  // no extra tap.
  const framedLayout = storedLayout === "framed"
  // The current Home: the panel above, the rest a step back.
  const splitLayout = !gateLayout && !framedLayout
  // Study: `?walkInEntry=parent` makes the panel's top edge the way in
  // ("go into the walk-in"), the two cards what to do there; `row` (default)
  // keeps it a light row under the cards. Remembered like the layout.
  const walkInEntryParam = searchParams.get("walkInEntry")
  if (walkInEntryParam === "parent" || walkInEntryParam === "row")
    writeStorage(WALK_IN_ENTRY_KEY, walkInEntryParam)
  const walkInEntryAsParent = readStorage(WALK_IN_ENTRY_KEY) === "parent"
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
              look={idleLook}
            />
          }
          attention={cause !== null}
          look={idleLook}
          onWake={() => {
            setWakeShield(true)
            onWake()
          }}
        />
      )}
      {wakeShield && (
        <div aria-hidden="true" className="absolute inset-0 z-40" />
      )}
      {recovered ? (
        <HomeRecoveredPanel />
      ) : showAttention ? (
        <HomeAttentionPanel
          cause={cause}
          eStop={attention?.eStop ?? null}
          teleopError={attention?.teleopError ?? null}
          retryable={attention?.retryable ?? false}
          retryState={retryState}
          onRetry={() => void retryRestart()}
          resumeMessage={resumeMessage}
          busy={busy}
          onRobotAction={onRobotAction}
          cameras={attention?.cameras ?? []}
          stuck={attentionStuck}
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
                  : `${t("workflow.home.attention.badge")}: ${t(`workflow.home.cause.${cause}`)}`}
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
                onClick={() => (assist ? setOpened(cause) : setSetAside(null))}
              >
                {t(
                  assist
                    ? "workflow.home.assist.open"
                    : "workflow.home.attention.backToImages"
                )}
              </Button>
            </div>
          )}
          {/* Study: `?homeLayout=gate` tries one way in to the walk-in. */}
          {gateLayout ? (
            <HomeWalkInGate
              disabled={busy || robotHeld}
              restockOpen={restockOpen}
              manualOpen={manualOpen}
              manualAvailable={manualReplenishmentAvailable}
              onRestock={onShowRestocking}
              onManual={onShowManualReplenishment}
              onOther={onEnterWalkInDirect}
            />
          ) : (
            <div
              className={cn(
                framedLayout
                  ? "flex min-h-0 flex-col gap-3 rounded-xl border-2 border-strong bg-subtle p-4 lg:flex-1 lg:gap-4"
                  : // The three whose steps stop the robot, said once at the
                    // top of a quiet panel. Layout change stops it later, at
                    // send, so it stays outside.
                    // Set apart by space as well as by the panel.
                    "mb-2 flex min-h-0 flex-col gap-3 rounded-xl bg-black/3 p-3 lg:flex-1"
              )}
            >
              {!framedLayout &&
                (walkInEntryAsParent ? (
                  // All three go into the walk-in; going in is the parent,
                  // the cards are what to do there.
                  <Button
                    variant="unstyled"
                    size="unstyled"
                    type="button"
                    disabled={busy || robotHeld}
                    onClick={onEnterWalkIn}
                    className="flex min-h-18 w-full items-center gap-4 rounded-lg border-2 border-black/20 bg-default px-4 py-2 text-left whitespace-normal active:bg-subtle"
                  >
                    <img
                      src="/assets/home-study-2026-10-06/walk-in-enter.svg"
                      alt=""
                      draggable={false}
                      className="h-12 w-auto shrink-0"
                    />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-xl/tight font-bold">
                        {t("workflow.home.enterWalkIn")}
                      </span>
                      <span className="flex items-center gap-1.5 text-base text-secondary">
                        <Power aria-hidden="true" className="size-4 shrink-0" />
                        {t("workflow.home.stopsRobot")}
                      </span>
                    </span>
                    <ChevronRight
                      aria-hidden="true"
                      className="size-7 shrink-0 text-secondary"
                    />
                  </Button>
                ) : (
                  <p className="flex items-center gap-2 px-1 text-lg/tight text-secondary">
                    <Power aria-hidden="true" className="size-5 shrink-0" />
                    {t("workflow.home.stopsRobot")}
                  </p>
                ))}
              {framedLayout && (
                <p className="flex items-center gap-3 text-xl font-bold text-primary">
                  <img
                    src="/assets/home-study-2026-10-06/enter.svg"
                    alt=""
                    draggable={false}
                    className="h-7 w-auto"
                  />
                  {t("workflow.home.framedHeading")}
                </p>
              )}
              {framedLayout && (
                <HomePurposeAction
                  icon="enter"
                  title={t("workflow.home.v5.enter")}
                  subtitle={t("workflow.home.v5.enterHint")}
                  disabled={busy || robotHeld}
                  onClick={onEnterWalkIn}
                />
              )}
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
              {!framedLayout && !walkInEntryAsParent && (
                <HomePurposeAction
                  icon="enter"
                  tall
                  title={t("workflow.home.enterWalkIn")}
                  disabled={busy || robotHeld}
                  onClick={onEnterWalkIn}
                />
              )}
            </div>
          )}
          {splitLayout ? (
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
          ) : (
            <>
              <HomePurposeAction
                icon="layout"
                title={t("workflow.home.layout")}
                disabled={busy || robotHeld}
                onClick={onShowEdit}
                quiet={splitLayout}
              />
              <div className="grid shrink-0 grid-cols-1 gap-3 min-[440px]:grid-cols-2 lg:gap-4">
                <HomePurposeAction
                  icon="reservation"
                  title={t("workflow.home.v5.reservations")}
                  disabled={busy}
                  onClick={onShowDisplay}
                  quiet={splitLayout}
                />
                <HomePurposeAction
                  icon="stock-count"
                  title={t("workflow.home.count")}
                  disabled={busy}
                  onClick={onShowRecommendations}
                  quiet={splitLayout}
                />
              </div>
            </>
          )}
        </section>
      )}
    </div>
  )
}

function HomePurposeAction({
  icon,
  title,
  subtitle,
  disabled,
  onClick,
  quiet = false,
  tall = false,
}: {
  icon: "enter" | "layout" | "reservation" | "stock-count"
  title: string
  subtitle?: string
  disabled: boolean
  onClick: () => void
  /** A step back from the panel above: a thin line, no fill. */
  quiet?: boolean
  /** Room to hit easily: the walk-in entry under the cards. */
  tall?: boolean
}) {
  return (
    <Button
      variant="unstyled"
      size="unstyled"
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "w-full min-w-0 shrink-0 justify-start gap-3 rounded-lg px-4 py-3 text-left whitespace-normal active:bg-subtle",
        quiet
          ? "min-h-16 border border-black/30"
          : "min-h-20 border-2 border-black/20 bg-default",
        tall && "min-h-24"
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center gap-0.5 rounded-md text-secondary",
          !quiet && "bg-subtle"
        )}
      >
        <img
          src={`/assets/home-study-2026-10-06/${icon}.${icon === "stock-count" ? "png" : "svg"}`}
          alt=""
          draggable={false}
          className={icon === "stock-count" ? "size-full" : "h-7 w-auto"}
        />
      </span>
      {/* Title and its hint side by side (24 / 20 px), the hint quieter. */}
      <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="text-xl/tight font-bold text-primary">{title}</span>
        {subtitle && (
          <span className="text-lg/tight text-secondary">{subtitle}</span>
        )}
      </span>
    </Button>
  )
}

// After an operator request the robot is stopped by staff or handled by the
// operator, so it has not necessarily resumed.
/** How long a restart gets to move the robot before "Try again" reports it still held. */
const RETRY_SETTLE_MS = 6000
const HOME_LAYOUT_KEY = "storeApp.study.homeLayout"
const WALK_IN_ENTRY_KEY = "storeApp.study.walkInEntry"
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
    const timer = window.setTimeout(() => setRecovered(false), 6000)
    return () => window.clearTimeout(timer)
  }, [cause])
  return recovered && cause === null
}
