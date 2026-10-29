import { useEffect, useState } from "react"

import type { ParseKeys } from "i18next"
import { CircleCheck, Hand, RotateCcw } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { RobotLiveCamera, TeleopErrorCodeName } from "~/api/opm/schemas"
import { Button } from "~/core"
import type { RobotAttentionCause } from "~/model/robot-attention"

import { AttentionLayout } from "./attention-layout"
import { HomeDetectorPanel } from "./home-detector-panel"

type Copy = { title: ParseKeys<"app">; sub: ParseKeys<"app"> }

/**
 * What happened and what to do, for each error the Unity app's
 * `CanFixByStore` lets staff fix. Inferred from the error names; to confirm
 * with operations.
 */
const TELEOP_COPY: Partial<Record<TeleopErrorCodeName, Copy>> = {
  FailedToGraspAtStock: {
    title: "workflow.home.teleop.graspAtStockTitle",
    sub: "workflow.home.teleop.graspAtStockSub",
  },
  FailedToGraspInMotion: {
    title: "workflow.home.teleop.graspInMotionTitle",
    sub: "workflow.home.teleop.graspInMotionSub",
  },
  AnomalyDetectedOnDisplay: {
    title: "workflow.home.teleop.anomalyOnDisplayTitle",
    sub: "workflow.home.teleop.anomalyOnDisplaySub",
  },
  DetectionFailureOnDisplay: {
    title: "workflow.home.teleop.detectionOnDisplayTitle",
    sub: "workflow.home.teleop.detectionOnDisplaySub",
  },
  DetectionFailureOnStock: {
    title: "workflow.home.teleop.detectionOnStockTitle",
    sub: "workflow.home.teleop.detectionOnStockSub",
  },
  EmptyStock: {
    title: "workflow.home.teleop.emptyStockTitle",
    sub: "workflow.home.teleop.emptyStockSub",
  },
  NearStuckStock: {
    title: "workflow.home.teleop.stuckStockTitle",
    sub: "workflow.home.teleop.stuckStockSub",
  },
  FarStuckStock: {
    title: "workflow.home.teleop.stuckStockTitle",
    sub: "workflow.home.teleop.stuckStockSub",
  },
}

const TELEOP_FALLBACK: Copy = {
  title: "workflow.home.teleop.fallbackTitle",
  sub: "workflow.home.teleop.fallbackSub",
}

/** The copy for an operator request staff can fix. */
export function teleopCopy(code: TeleopErrorCodeName | null): Copy {
  return (code && TELEOP_COPY[code]) || TELEOP_FALLBACK
}

/**
 * Takes over the action area. For a `blocking` cause the robot stays stopped
 * until staff act, so this comes before any other task; for the `assist`
 * cause staff opened it from the bar to fix it sooner than the operator.
 */
export function HomeAttentionPanel({
  cause,
  teleopError,
  retryable,
  retryState,
  onRetry,
  resumeMessage,
  cameras,
  busy,
  onRobotAction,
  holdPhase,
  onHoldForWalkIn,
  onOtherWork,
}: {
  cause: RobotAttentionCause
  teleopError: TeleopErrorCodeName | null
  /** Offer "Try again" (restart the robot) for a detector stop right after a restart. */
  retryable: boolean
  /** `checking` while the restart lands; `still` when the cause outlived it. */
  retryState: "idle" | "checking" | "still"
  onRetry: () => void
  /** Why the app's own restart failed, already translated (resumeFailed only). */
  resumeMessage: string
  cameras: RobotLiveCamera[]
  busy: boolean
  /** Resume, or check and stop, as the cause asks. */
  onRobotAction: () => void
  /** Stopping the robot for staff to go in, and then stopped. */
  holdPhase: "holding" | "held" | null
  /** Stop the robot as the store, so it stays stopped while staff are inside. */
  onHoldForWalkIn: () => void
  onOtherWork: () => void
}) {
  const { t } = useTranslation("app")
  const copy = teleopCopy(teleopError)

  return (
    <section className="flex min-h-0 min-w-0 flex-col gap-4 overflow-y-auto p-4 lg:p-5">
      {cause === "human" || cause === "obstacle" ? (
        <HomeDetectorPanel
          detector={cause}
          retryable={retryable}
          retryState={retryState}
          onRetry={onRetry}
          holdPhase={holdPhase}
          onHoldForWalkIn={onHoldForWalkIn}
          cameras={cameras}
          busy={busy}
        />
      ) : cause === "resumeFailed" ? (
        <AttentionLayout
          icon={RotateCcw}
          title={t("workflow.home.attention.titleResumeFailed")}
          body={resumeMessage}
          support={{
            heading: t("workflow.home.attention.resumeSupport"),
            body: t("workflow.home.attention.supportBody"),
          }}
          action={
            <Button
              size="lg"
              className="w-full"
              disabled={busy}
              onClick={onRobotAction}
            >
              {t("workflow.home.attention.actionResume")}
            </Button>
          }
        />
      ) : (
        <AttentionLayout
          icon={Hand}
          title={t(copy.title)}
          body={t(copy.sub)}
          support={{
            heading: t("workflow.home.attention.teleopSupport"),
            body: t("workflow.home.attention.supportBody"),
          }}
          camera={{ frames: cameras, showDetectedKey: false }}
          action={
            // The existing stop flow: confirm, three-point check, then stop.
            <Button
              size="lg"
              className="w-full"
              disabled={busy}
              onClick={onRobotAction}
            >
              {t("workflow.home.attention.actionCheckAndStop")}
            </Button>
          }
        />
      )}
      <Button
        variant="unstyled"
        size="unstyled"
        type="button"
        onClick={onOtherWork}
        className="self-center px-4 py-2 text-sm font-bold text-secondary underline underline-offset-4"
      >
        {t(
          cause === "teleopFixable"
            ? "workflow.home.attention.close"
            : "workflow.home.attention.otherWork"
        )}
      </Button>
    </section>
  )
}

/** How long the "fixed" confirmation stays before Home comes back. */
export const RECOVERED_SECONDS = 5

/**
 * Brief confirmation once the cause clears and the robot carries on. It says
 * where it goes next and when, so staff know there is nothing left to do.
 */
export function HomeRecoveredPanel() {
  const { t } = useTranslation("app")
  const [secondsLeft, setSecondsLeft] = useState(RECOVERED_SECONDS)
  const [started, setStarted] = useState(false)
  useEffect(() => {
    // Next frame, so the bar transitions from full rather than starting empty.
    const frame = window.requestAnimationFrame(() => setStarted(true))
    const timer = window.setInterval(
      () => setSecondsLeft((seconds) => Math.max(seconds - 1, 1)),
      1000
    )
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearInterval(timer)
    }
  }, [])
  return (
    <section className="grid min-h-0 min-w-0 place-items-center p-4 lg:p-5">
      <div
        role="status"
        className="flex flex-col items-center gap-3 text-center"
      >
        <CircleCheck className="size-20 text-success" />
        <h2 className="text-display font-bold">
          {t("workflow.home.recovered.title")}
        </h2>
        <p className="text-lg text-secondary">
          {t("workflow.home.recovered.body")}
        </p>
        <div className="mt-6 flex w-64 flex-col items-center gap-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-subtle">
            <div
              className={
                started
                  ? "h-full w-0 rounded-full bg-success transition-[width] duration-5000 ease-linear"
                  : "size-full rounded-full bg-success"
              }
            />
          </div>
          <p className="text-base text-secondary">
            {t("workflow.home.recovered.backIn", { seconds: secondsLeft })}
          </p>
        </div>
      </div>
    </section>
  )
}
