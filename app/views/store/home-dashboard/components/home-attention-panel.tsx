import type { ParseKeys } from "i18next"
import { CircleCheck, Hand, OctagonX, RotateCcw } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { RobotLiveCamera, TeleopErrorCodeName } from "~/api/opm/schemas"
import { CloseCountdown } from "~/components/feedback/close-countdown"
import { Button } from "~/core"
import type { RobotAttentionCause, RobotEStop } from "~/model/robot-attention"

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

const ESTOP_ASSET = "/assets/estop/estop-released"

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
  busy,
  onRobotAction,
  holdPhase,
  onHoldForWalkIn,
  onOtherWork,
}: {
  cause: RobotAttentionCause
  /** Pressed, or released but needing a restart (eStop only). */
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
      ) : cause === "eStop" ? (
        // A panel like the detectors, not a popup: the robot is stopped until
        // staff clear what stops it, the same ask (Yotaro 2026-11-11). Nothing
        // here moves it, so there is no button: it clears when released.
        <EStopPanel eStop={eStop} />
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
        className="self-center px-4 py-2 text-base font-bold text-secondary underline underline-offset-4"
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

function EStopPanel({ eStop }: { eStop: RobotEStop | null }) {
  const { t } = useTranslation("app")
  const needsReset = eStop === "needsReset"
  return (
    <AttentionLayout
      icon={OctagonX}
      title={t(
        needsReset
          ? "workflow.home.attention.eStopResetTitle"
          : "workflow.home.attention.eStopTitle"
      )}
      body={t(
        needsReset
          ? "workflow.home.attention.eStopResetSub"
          : "workflow.home.attention.eStopSub"
      )}
      support={{
        heading: t(
          needsReset
            ? "workflow.home.attention.eStopResetSupport"
            : "workflow.home.attention.eStopSupport"
        ),
        body: t(
          needsReset
            ? "workflow.home.attention.eStopResetSupportBody"
            : "workflow.home.attention.supportBody"
        ),
      }}
      action={
        // What happens next, so staff need not come back to the tablet.
        <p className="text-lg text-secondary">
          {t(
            needsReset
              ? "workflow.home.attention.eStopResetAutoClose"
              : "workflow.home.attention.eStopAutoClose"
          )}
        </p>
      }
      aside={
        needsReset ? undefined : (
          // How the button looks once released: it springs out and shows its
          // red collar. Plays once and stays on that state.
          <figure className="flex min-h-0 flex-col items-center justify-center gap-3">
            <video
              aria-label={t("workflow.home.attention.eStopReleasedCaption")}
              autoPlay
              muted
              playsInline
              poster={`${ESTOP_ASSET}.png`}
              className="aspect-640/598 max-h-full w-full max-w-80 rounded-lg ring-1 ring-black/10"
            >
              <source src={`${ESTOP_ASSET}.webm`} type="video/webm" />
              <source src={`${ESTOP_ASSET}.mp4`} type="video/mp4" />
            </video>
            <figcaption className="text-lg">
              {t("workflow.home.attention.eStopReleasedCaption")}
            </figcaption>
          </figure>
        )
      }
    >
      {!needsReset && (
        <ol className="grid gap-3 text-lg font-bold">
          {(
            [
              "workflow.home.attention.eStopStep1",
              "workflow.home.attention.eStopStep2",
            ] as const
          ).map((key, index) => (
            <li key={key} className="flex items-start gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-inverse text-base text-inverse">
                {index + 1}
              </span>
              <span className="pt-0.5">{t(key)}</span>
            </li>
          ))}
        </ol>
      )}
    </AttentionLayout>
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
        <div className="mt-6">
          <CloseCountdown
            label={(seconds) =>
              t("workflow.home.recovered.backIn", { seconds })
            }
            seconds={RECOVERED_SECONDS}
          />
        </div>
      </div>
    </section>
  )
}
