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
  const stoppingNow = checking && !blockingTask
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
      className={cn(
        "pointer-events-none h-full w-auto max-w-full object-contain",
        stoppingNow ? "mx-auto object-bottom" : "object-bottom-left"
      )}
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

  if (stoppingNow)
    return (
      <section className="grid min-h-0 min-w-0 flex-1 grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-6 overflow-y-auto bg-subtle p-6">
        <div className="flex min-h-0 flex-col">
          {pill}
          <StopProgress {...stopping} />
        </div>
        <div className="min-h-0 overflow-hidden">{robot}</div>
      </section>
    )

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-y-auto bg-subtle p-6">
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6">
        <div className="flex min-h-0 flex-col">
          {pill}
          <p className="mt-4 max-w-md text-lg/relaxed">
            {blockingTask
              ? t("workflow.walkIn.workOpenHint")
              : ready
                ? t("workflow.walkIn.stoppedHint")
                : canPrepare
                  ? t("workflow.walkIn.stopFirstHint")
                  : notReadyReason}
          </p>
          <div className="mt-4 min-h-0 flex-1 overflow-hidden">{robot}</div>
        </div>
        <RobotArmPanel {...arm} />
      </div>
      <Button
        size="lg"
        variant="unstyled"
        className="min-h-20 w-full shrink-0 rounded-xl bg-primary text-xl font-bold text-on-primary active:bg-primary-pressed disabled:opacity-50"
        busy={busy}
        disabled={blockingTask ? busy : ready ? busy : !canPrepare || busy}
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
 * While the robot stops: what it is doing, and above all not to go in. No
 * time or progress bar: how long the travel takes depends on where on the
 * rail the robot is, which the app cannot know.
 */
function StopProgress({ slow, statusLost, hold }: StopProgressProps) {
  const { t } = useTranslation("app")
  const trouble = statusLost || hold
  return (
    <div className="mt-6 flex min-h-0 flex-1 flex-col gap-6">
      <p className="flex items-center gap-3 text-[1.75rem]/tight font-bold">
        <span className="relative grid size-4 shrink-0 place-items-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-success opacity-60" />
          <span className="size-3 rounded-full bg-success" />
        </span>
        {t("workflow.walkIn.stepMove")}
      </p>
      <p className="flex items-center gap-5 rounded-xl bg-warning px-7 py-8 text-[2.5rem]/tight font-bold whitespace-pre-line text-inverse">
        <TriangleAlert className="size-14 shrink-0" />
        {t("workflow.walkIn.dontEnterYet")}
      </p>
      {(trouble || slow) && (
        <p
          role="status"
          className={cn(
            "text-xl/relaxed font-bold",
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
