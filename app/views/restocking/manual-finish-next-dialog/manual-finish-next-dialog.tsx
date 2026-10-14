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
    <Dialog.Root
      className="grid min-h-75 max-w-dialog grid-rows-[auto_1fr_auto] gap-4 px-8 pt-12 pb-10"
      initialFocus={restockRef}
      open={open}
      role="alertdialog"
    >
      <Dialog.Title className="text-center">
        {t("manualEndAskRestockingTitle")}
      </Dialog.Title>
      <Dialog.Message className="self-center">
        {t("manualEndAskRestockingMessage")}
      </Dialog.Message>

      <Dialog.Footer className="max-w-dialog-sm">
        <Button
          ref={restockRef}
          disabled={busy}
          size="sm"
          onClick={onStartRestocking}
        >
          {t("manualEndStartRestockingButton")}
        </Button>
        <Button
          disabled={busy}
          size="sm"
          variant="secondary"
          onClick={onStartRobot}
        >
          {t("manualEndStartRobotButton")}
        </Button>
      </Dialog.Footer>
    </Dialog.Root>
  )
}
