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
 * The header robot popup.
 * - Robot running: staff who reach for "stop first" learn that every task
 *   stops the robot by itself. The note sits right above a quiet stop
 *   button, so it is read before pressing; stopping still works, with no
 *   "are you sure".
 * - Robot stopped: the robot status and one big start button.
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

  if (action === "stop") {
    return (
      <Dialog.Popup
        open={open}
        onClose={onClose}
        closeLabel={t("common:actions.close")}
        title={t("workflow.robotPower.title")}
      >
        <div className="flex flex-col gap-4">
          <p className="text-base whitespace-pre-line text-secondary">
            {t("workflow.robotPower.stopNote")}
          </p>
          <Button
            variant="secondary"
            size="lg"
            className="self-start px-6"
            disabled={busy}
            onClick={onAction}
          >
            <Power aria-hidden="true" className="size-5" />
            {t("workflow.robotPower.stop")}
          </Button>
        </div>
      </Dialog.Popup>
    )
  }

  const label = t("workflow.robotPower.start")
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
          className="grid size-36 place-items-center rounded-full bg-primary text-on-primary transition active:scale-95 active:bg-primary-pressed disabled:opacity-50"
          onClick={onAction}
        >
          <Power className="size-16" strokeWidth={2.5} />
        </Button>
        <p className="text-xl font-bold">{label}</p>
      </div>
    </Dialog.Popup>
  )
}
