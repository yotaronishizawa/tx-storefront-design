import { useEffect, useState } from "react"

import type { ParseKeys } from "i18next"
import { Camera, CircleCheck, Phone, TriangleAlert } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { RobotLiveCamera, TeleopErrorCodeName } from "~/api/opm/schemas"
import { OPERATIONS_CENTER_PHONE } from "~/config/app"
import { Button } from "~/core"
import type { RobotAttentionCause, RobotEStop } from "~/model/robot-attention"
import { formatDate } from "~/utils/date"

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
  eStop,
  teleopError,
  retryable,
  retryState,
  onRetry,
  resumeMessage,
  cameras,
  stuck,
  busy,
  onRobotAction,
  holdPhase,
  onHoldForWalkIn,
  onOtherWork,
}: {
  cause: RobotAttentionCause
  eStop: RobotEStop | null
  teleopError: TeleopErrorCodeName | null
  /** Offer "Try again" (restart the robot) for a detector stop right after a restart. */
  retryable: boolean
  /** `checking` while the restart lands; `still` when the cause outlived it. */
  retryState: "idle" | "checking" | "still"
  onRetry: () => void
  /** Why the app's own restart failed, already translated (resumeFailed only). */
  resumeMessage: string
  cameras: RobotLiveCamera[]
  /** Not fixed for a while: likely beyond what the store can do. */
  stuck: boolean
  busy: boolean
  /** Resume, or check and stop, as the cause asks. */
  onRobotAction: () => void
  /** Stopping the robot for staff to go in, and then stopped. */
  holdPhase: "holding" | "held" | null
  /** Stop the robot as the store, so it stays stopped while staff are inside. */
  onHoldForWalkIn: () => void
  onOtherWork: () => void
}) {
  const { i18n, t } = useTranslation("app")
  const copy = cause === "teleopFixable" ? teleopCopy(teleopError) : null

  return (
    <section className="flex min-h-0 min-w-0 flex-col gap-4 overflow-y-auto p-4 lg:p-5">
      {cause === "resumeFailed" ? (
        <div className="flex flex-col gap-4 rounded-lg border-2 border-error bg-default p-5">
          <h2 className="flex items-center gap-3 text-xl/tight font-bold">
            <TriangleAlert className="size-8 shrink-0 text-error" />
            {t("workflow.home.attention.titleResumeFailed")}
          </h2>
          <p className="text-lg/relaxed whitespace-pre-line">{resumeMessage}</p>
          <Button
            size="lg"
            className="self-start"
            disabled={busy}
            onClick={onRobotAction}
          >
            {t("workflow.home.attention.actionResume")}
          </Button>
        </div>
      ) : cause === "eStop" ? (
        <div className="flex flex-col gap-4 rounded-lg border-2 border-error bg-default p-5">
          <h2 className="flex items-center gap-3 text-xl/tight font-bold">
            <TriangleAlert className="size-8 shrink-0 text-error" />
            {t(
              eStop === "needsReset"
                ? "workflow.home.attention.eStopResetTitle"
                : "workflow.home.attention.eStopTitle"
            )}
          </h2>
          <ol className="grid gap-3 text-lg font-bold">
            {(eStop === "needsReset"
              ? ([
                  "workflow.home.attention.eStopResetStep1",
                  "workflow.home.attention.eStopResetStep2",
                ] as const)
              : ([
                  "workflow.home.attention.eStopStep1",
                  "workflow.home.attention.eStopStep2",
                  "workflow.home.attention.eStopStep3",
                ] as const)
            ).map((key, index) => (
              <li key={key} className="flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-inverse text-base text-inverse">
                  {index + 1}
                </span>
                <span className="pt-0.5">{t(key)}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : cause === "human" ||
        cause === "obstacle" ||
        cause === "fallenDrink" ? (
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
      ) : (
        <>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl/tight font-bold">
                {copy ? t(copy.title) : ""}
              </h2>
              <p className="mt-1 text-base text-secondary">
                {copy ? t(copy.sub) : ""}
              </p>
            </div>
            {cause === "teleopFixable" && (
              // The existing stop flow: confirm, three-point check, then stop.
              <Button size="lg" disabled={busy} onClick={onRobotAction}>
                {t("workflow.home.attention.actionCheckAndStop")}
              </Button>
            )}
          </div>
          {/* The camera frames from GetRobotLiveData. */}
          <div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
            {/* Until the first frames arrive, hold the space so nothing jumps. */}
            {(cameras.length > 0
              ? cameras
              : ([1, 2] as const).map((camera) => ({
                  camera,
                  src: "",
                  capturedAt: null,
                }))
            ).map(({ camera, src, capturedAt }) => (
              <figure
                key={camera}
                className="flex min-h-48 flex-col overflow-hidden rounded-lg bg-inverse text-inverse"
              >
                <div className="relative grid min-h-0 flex-1 place-items-center">
                  {src ? (
                    <img
                      src={src}
                      alt={t("workflow.home.attention.camera", { camera })}
                      className="absolute inset-0 size-full object-contain"
                      draggable={false}
                    />
                  ) : (
                    <Camera className="size-12 opacity-40" />
                  )}
                </div>
                <figcaption className="flex items-center justify-between gap-2 px-3 py-2 text-sm font-bold">
                  <span>{t("workflow.home.attention.camera", { camera })}</span>
                  {capturedAt !== null && (
                    <span className="opacity-70">
                      {t("workflow.home.attention.capturedAt", {
                        time: formatDate(capturedAt, "clock", i18n.language),
                      })}
                    </span>
                  )}
                </figcaption>
              </figure>
            ))}
          </div>
        </>
      )}
      {stuck && (cause === "eStop" || cause === "resumeFailed") && (
        <p className="flex items-center gap-2 rounded-md bg-error-subtle px-4 py-3 text-base font-bold text-error">
          <Phone className="size-5 shrink-0" />
          {t("workflow.home.attention.stuck", {
            phone: OPERATIONS_CENTER_PHONE,
          })}
        </p>
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
