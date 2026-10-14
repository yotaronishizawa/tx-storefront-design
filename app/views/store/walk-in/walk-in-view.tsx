import { TriangleAlert } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { RobotArmControlProps } from "~/components/robot/robot-arm-control"
import { RobotArmPanel } from "~/components/robot/robot-arm-panel"
import { Button } from "~/core"
import { cn } from "~/utils/cn"

/**
 * Inside the walk-in. Staff reach it after confirming on Home that the robot
 * stops, so it opens already stopping the robot: the robot's status on the
 * left, moving the robot up or down on the right, and "Leave the walk-in"
 * along the bottom.
 */
export function WalkInView({
  ready,
  checking,
  busy,
  canPrepare,
  notReadyReason,
  blockingTask,
  statusLabel,
  robotMoving,
  stopping,
  arm,
  onPrepare,
  onHandBack,
  onReturnToTask,
}: {
  ready: boolean
  checking: boolean
  busy: boolean
  canPrepare: boolean
  /** Why the robot cannot be parked for entry now, already translated. */
  notReadyReason: string
  blockingTask: "restock" | "manual" | ""
  /** What the robot is doing, as the Home pill words it, already translated. */
  statusLabel: string
  robotMoving: boolean
  stopping: StopProgressProps
  arm: Omit<RobotArmControlProps, "open" | "onOpenChange">
  onPrepare: () => void
  onHandBack: () => void
  onReturnToTask: () => void
}) {
  const { t } = useTranslation("app")
  const clip = ready
    ? "resting"
    : robotMoving || checking
      ? "normal"
      : "resting"
  // While the robot stops there is one thing to do: wait outside. Nothing
  // that only works once it has stopped (moving it, leaving) is shown yet.
  // Only once there is a stop to wait for: a robot already at rest goes
  // straight to the stopped screen instead of flashing this one.
  const stoppingNow =
    checking && !blockingTask && (robotMoving || stopping.phase === "moving")
  const pill = (
    <p
      role="status"
      className={cn(
        "self-start rounded-full px-6 py-2 text-[2rem]/tight font-bold",
        robotMoving && !ready
          ? "bg-success text-inverse"
          : "bg-muted text-primary"
      )}
    >
      {statusLabel}
    </p>
  )
  const robot = (
    // Same clips as the robot status on Home: resting once stopped.
    <video
      key={clip}
      aria-hidden="true"
      autoPlay
      loop
      muted
      playsInline
      disablePictureInPicture
      className="pointer-events-none h-full w-auto max-w-full object-contain object-bottom-left"
    >
      <source
        src={`/assets/home-study-2026-10-06/robot-${clip}.mov`}
        type='video/quicktime; codecs="hvc1"'
      />
      <source
        src={`/assets/home-study-2026-10-06/robot-${clip}.webm`}
        type="video/webm"
      />
    </video>
  )

  // One frame for both states, so stopping only swaps the right card and
  // reveals the button: the robot and its status never jump.
  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-y-auto bg-subtle p-6">
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6">
        <div className="flex min-h-0 flex-col">
          {pill}
          {stoppingNow ? (
            <StopStatus {...stopping} />
          ) : (
            <p className="mt-4 max-w-md text-lg/relaxed">
              {blockingTask
                ? t("workflow.walkIn.workOpenHint")
                : ready
                  ? t("workflow.walkIn.stoppedHint")
                  : canPrepare
                    ? t("workflow.walkIn.stopFirstHint")
                    : notReadyReason}
            </p>
          )}
          <div className="mt-4 min-h-0 flex-1 overflow-hidden">{robot}</div>
        </div>
        {stoppingNow ? <DontEnterCard /> : <RobotArmPanel {...arm} />}
      </div>
      {/* Hidden, not removed, while the robot stops: the layout stays put. */}
      <Button
        size="lg"
        variant="unstyled"
        aria-hidden={stoppingNow}
        className={cn(
          "min-h-20 w-full shrink-0 rounded-xl bg-primary text-xl font-bold text-on-primary active:bg-primary-pressed disabled:opacity-50",
          stoppingNow && "invisible"
        )}
        busy={busy}
        disabled={
          stoppingNow ||
          (blockingTask ? busy : ready ? busy : !canPrepare || busy)
        }
        onClick={blockingTask ? onReturnToTask : ready ? onHandBack : onPrepare}
      >
        {t(
          blockingTask
            ? blockingTask === "restock"
              ? "workflow.walkIn.backToRestock"
              : "workflow.walkIn.backToManual"
            : ready
              ? "workflow.walkIn.leave"
              : "workflow.walkIn.stopRobot"
        )}
      </Button>
    </section>
  )
}

/** Where the arm card will be: the one thing that matters while it stops. */
function DontEnterCard() {
  const { t } = useTranslation("app")
  return (
    <section className="flex min-h-0 flex-col items-center justify-center gap-6 rounded-xl bg-warning p-8 text-center text-inverse">
      <TriangleAlert className="size-20 shrink-0" />
      <p className="text-[2.5rem]/tight font-bold whitespace-pre-line">
        {t("workflow.walkIn.dontEnterYet")}
      </p>
    </section>
  )
}

type StopProgressProps = {
  /** The request going out, then the robot travelling to its rest position. */
  phase: "sending" | "moving"
  /** Still travelling well past the usual; worded, never timed. */
  slow: boolean
  /** The app has lost the robot's status (offline or polls failing). */
  statusLost: boolean
  /** What is holding the robot (a person, an obstacle, the e-stop), translated. */
  hold: string
}

/**
 * Under the pill while the robot stops: what it is doing, and anything
 * holding it. No time or progress bar: how long the travel takes depends on
 * where on the rail the robot is, which the app cannot know.
 */
function StopStatus({ slow, statusLost, hold }: StopProgressProps) {
  const { t } = useTranslation("app")
  const trouble = statusLost || hold
  return (
    <div className="mt-4 grid max-w-md gap-3">
      <p className="text-lg/relaxed">{t("workflow.walkIn.stepMove")}</p>
      {(trouble || slow) && (
        <p
          role="status"
          className={cn(
            "text-lg/relaxed font-bold",
            trouble ? "text-error" : "text-secondary"
          )}
        >
          {statusLost
            ? t("workflow.walkIn.statusLost")
            : hold
              ? t("workflow.walkIn.heldBy", { reason: hold })
              : t("workflow.walkIn.takingLonger")}
        </p>
      )}
    </div>
  )
}
