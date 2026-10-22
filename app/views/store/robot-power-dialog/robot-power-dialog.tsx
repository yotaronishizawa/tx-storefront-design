import { Power } from "lucide-react"
import { useTranslation } from "react-i18next"

import {
  ROBOT_MOVING_KINDS,
  ROBOT_STATUS_LABELS,
} from "~/components/robot/robot-status-label"
import { Button, Dialog } from "~/core"
import type { RobotStatusKind } from "~/model/robot-status"
import { cn } from "~/utils/cn"

/**
 * The header robot popup: the robot status, then one quiet power button,
 * "stop" while the robot runs and "start" while it is stopped.
 * While it runs, a note right above the button says the tasks stop the robot
 * by themselves, so staff who reach for "stop first" read it before
 * pressing; stopping still works, with no "are you sure".
 */
export function RobotPowerDialog({
  open,
  kind,
  available,
  action,
  busy,
  onAction,
  onClose,
}: {
  open: boolean
  kind: RobotStatusKind
  /** `false` while offline or the status is stale: the status reads unknown. */
  available: boolean
  action: "stop" | "start"
  busy: boolean
  onAction: () => void
  onClose: () => void
}) {
  const { t } = useTranslation(["app", "common"])
  const moving = available && ROBOT_MOVING_KINDS.has(kind)

  return (
    <Dialog.Popup
      open={open}
      onClose={onClose}
      closeLabel={t("common:actions.close")}
      title={t("workflow.robotPower.title")}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-bold text-secondary">{t("robotStatus")}</span>
        <p
          role="status"
          className={cn(
            "rounded-full px-4 py-1.5 text-base font-bold",
            moving ? "bg-success text-inverse" : "bg-muted text-primary"
          )}
        >
          {t(
            kind === "noRobot" || available
              ? ROBOT_STATUS_LABELS[kind]
              : ROBOT_STATUS_LABELS.unknown
          )}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {action === "stop" && (
          <p className="text-base whitespace-pre-line text-secondary">
            {t("workflow.robotPower.stopNote")}
          </p>
        )}
        <Button
          variant="secondary"
          size="lg"
          className="self-start px-6"
          disabled={busy}
          onClick={onAction}
        >
          <Power aria-hidden="true" className="size-5" />
          {t(
            action === "stop"
              ? "workflow.robotPower.stop"
              : "workflow.robotPower.start"
          )}
        </Button>
      </div>
    </Dialog.Popup>
  )
}
