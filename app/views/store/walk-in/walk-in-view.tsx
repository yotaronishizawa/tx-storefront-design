import { ArrowRight, CheckCircle2, DoorOpen, ShieldAlert } from "lucide-react"
import { useTranslation } from "react-i18next"

import {
  RobotPositionControls,
  type RobotPositionControlsProps,
} from "~/components/robot/robot-position-controls"
import { Button } from "~/core"
import { cn } from "~/utils/cn"

export function WalkInView({
  ready,
  checking,
  busy,
  canPrepare,
  notReadyReason,
  blockingTask,
  position,
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
  position: RobotPositionControlsProps
  onPrepare: () => void
  onHandBack: () => void
  onReturnToTask: () => void
}) {
  const { t } = useTranslation("app")
  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto rounded-xl bg-subtle p-4 sm:p-6">
      <header className="flex items-center gap-3">
        <DoorOpen className="size-7" />
        <h1 className="text-xl font-bold">{t("workflow.walkIn.title")}</h1>
      </header>
      {!blockingTask && <RobotPositionControls {...position} />}
      <div className="grid min-h-0 flex-1 items-center gap-6 rounded-xl bg-default p-5 sm:grid-cols-[minmax(160px,0.7fr)_minmax(0,1fr)] sm:p-8">
        <img
          src="/assets/home-v5/robot.svg"
          alt=""
          draggable={false}
          className="mx-auto h-40 w-auto max-w-full object-contain sm:h-72 lg:h-88"
        />
        <div className="min-w-0">
          <div
            className={cn(
              "mb-4 inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold",
              ready
                ? "bg-success-subtle text-success"
                : "bg-subtle text-secondary"
            )}
          >
            {ready ? (
              <CheckCircle2 className="size-5" />
            ) : (
              <ShieldAlert className="size-5" />
            )}
            {t(
              blockingTask
                ? "workflow.walkIn.workOpen"
                : ready
                  ? "workflow.walkIn.parked"
                  : checking
                    ? "workflow.walkIn.checking"
                    : "workflow.walkIn.beforeEntry"
            )}
          </div>
          <h2 className="text-xl/snug font-bold sm:text-display">
            {t(
              blockingTask
                ? "workflow.walkIn.workOpenHint"
                : ready
                  ? "workflow.walkIn.checkSurroundings"
                  : "workflow.walkIn.prepareTitle"
            )}
          </h2>
          <p className="mt-4 text-base/relaxed text-secondary">
            {t(
              blockingTask
                ? "workflow.walkIn.finishInTask"
                : ready
                  ? "workflow.walkIn.whileInside"
                  : "workflow.walkIn.prepareHint"
            )}
          </p>
          {!ready && !checking && !blockingTask && !canPrepare && (
            <p className="mt-3 font-medium text-primary">{notReadyReason}</p>
          )}
        </div>
      </div>
      <Button
        size="lg"
        className="h-auto min-h-16 w-full shrink-0 py-4 text-center whitespace-normal"
        icon={<ArrowRight />}
        busy={checking || busy}
        disabled={blockingTask ? busy : ready ? busy : !canPrepare || busy}
        onClick={blockingTask ? onReturnToTask : ready ? onHandBack : onPrepare}
      >
        {t(
          blockingTask
            ? blockingTask === "restock"
              ? "workflow.walkIn.backToRestock"
              : "workflow.walkIn.backToManual"
            : ready
              ? "workflow.walkIn.handBack"
              : "workflow.walkIn.prepare"
        )}
      </Button>
    </section>
  )
}
