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
 * The header robot popup, a confirmation: the robot status, then "stop"
 * while the robot runs or "start" while it is stopped, and Cancel.
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
      actions={
        <Dialog.Actions>
          <Button size="lg" disabled={busy} onClick={onAction}>
            <Power aria-hidden="true" className="size-5" />
            {t(
              action === "stop"
                ? "workflow.robotPower.stop"
                : "workflow.robotPower.start"
            )}
          </Button>
          <Button size="lg" variant="secondary" onClick={onClose}>
            {t("common:actions.cancel")}
          </Button>
        </Dialog.Actions>
      }
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

      {action === "stop" && (
        <p className="text-base whitespace-pre-line text-secondary">
          {t("workflow.robotPower.stopNote")}
        </p>
      )}
    </Dialog.Popup>
  )
}
