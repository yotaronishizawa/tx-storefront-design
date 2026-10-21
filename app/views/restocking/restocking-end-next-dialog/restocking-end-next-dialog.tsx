import { useRef } from "react"

import { useTranslation } from "react-i18next"

import { Button, Dialog } from "~/core"

/**
 * After confirming End: stay stopped for manual replenishment, or restart the
 * robot and go home. Both end the restock, so there is no dismiss; focus starts
 * on the choice that keeps the robot stopped.
 */
export function RestockingEndNextDialog({
  busy,
  open,
  onGoToManual,
  onStartRobot,
}: {
  busy: boolean
  open: boolean
  onGoToManual: () => void
  onStartRobot: () => void
}) {
  const { t } = useTranslation("app")
  const manualRef = useRef<HTMLButtonElement>(null)

  return (
    <Dialog.Popup
      open={open}
      title={t("restockingEndGoToManualTitle")}
      initialFocus={manualRef}
      role="alertdialog"
      actions={
        <Dialog.Actions>
          <Button
            ref={manualRef}
            disabled={busy}
            size="lg"
            onClick={onGoToManual}
          >
            {t("restockingEndGoToManualButton")}
          </Button>
          <Button
            disabled={busy}
            size="lg"
            variant="secondary"
            onClick={onStartRobot}
          >
            {t("restockingEndStartRobotButton")}
          </Button>
        </Dialog.Actions>
      }
    >
      <p>{t("restockingEndGoToManualMessage")}</p>
    </Dialog.Popup>
  )
}
