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
    <Dialog.Root
      className="grid min-h-75 max-w-dialog grid-rows-[auto_1fr_auto] gap-4 px-8 pt-12 pb-10"
      initialFocus={manualRef}
      open={open}
      role="alertdialog"
    >
      <Dialog.Title className="text-center">
        {t("restockingEndGoToManualTitle")}
      </Dialog.Title>
      <Dialog.Message className="self-center">
        {t("restockingEndGoToManualMessage")}
      </Dialog.Message>

      <Dialog.Footer className="max-w-dialog-sm">
        <Button
          ref={manualRef}
          disabled={busy}
          size="sm"
          onClick={onGoToManual}
        >
          {t("restockingEndGoToManualButton")}
        </Button>
        <Button
          disabled={busy}
          size="sm"
          variant="secondary"
          onClick={onStartRobot}
        >
          {t("restockingEndStartRobotButton")}
        </Button>
      </Dialog.Footer>
    </Dialog.Root>
  )
}
