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
 * The header robot popup: the robot status and one power button, "stop" while
 * the robot runs and "start" while it is stopped.
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
  const label = t(
    action === "stop" ? "workflow.robotPower.stop" : "workflow.robotPower.start"
  )

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

      <div className="grid justify-items-center gap-4">
        <Button
          variant="unstyled"
          size="unstyled"
          type="button"
          disabled={busy}
          aria-label={label}
          className={cn(
            "grid size-36 place-items-center rounded-full transition active:scale-95 disabled:opacity-50",
            action === "stop"
              ? "bg-inverse text-inverse"
              : "bg-primary text-on-primary active:bg-primary-pressed"
          )}
          onClick={onAction}
        >
          <Power className="size-16" strokeWidth={2.5} />
        </Button>
        <p className="text-xl font-bold">{label}</p>
      </div>
    </Dialog.Popup>
  )
}
