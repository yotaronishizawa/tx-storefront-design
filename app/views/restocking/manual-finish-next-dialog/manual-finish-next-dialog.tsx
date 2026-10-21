import { useRef } from "react"

import { useTranslation } from "react-i18next"

import { Button, Dialog } from "~/core"

/**
 * After finishing manual replenishment: restock now, or restart the robot and
 * go home. Both end the task, so there is no dismiss.
 */
export function ManualFinishNextDialog({
  busy,
  open,
  onStartRestocking,
  onStartRobot,
}: {
  busy: boolean
  open: boolean
  onStartRestocking: () => void
  onStartRobot: () => void
}) {
  const { t } = useTranslation("app")
  const restockRef = useRef<HTMLButtonElement>(null)

  return (
    <Dialog.Popup
      open={open}
      title={t("manualEndAskRestockingTitle")}
      initialFocus={restockRef}
      role="alertdialog"
      actions={
        <Dialog.Actions>
          <Button
            ref={restockRef}
            disabled={busy}
            size="lg"
            onClick={onStartRestocking}
          >
            {t("manualEndStartRestockingButton")}
          </Button>
          <Button
            disabled={busy}
            size="lg"
            variant="secondary"
            onClick={onStartRobot}
          >
            {t("manualEndStartRobotButton")}
          </Button>
        </Dialog.Actions>
      }
    >
      <p>{t("manualEndAskRestockingMessage")}</p>
    </Dialog.Popup>
  )
}
