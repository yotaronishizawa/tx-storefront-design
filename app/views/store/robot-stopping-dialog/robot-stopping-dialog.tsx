import { useTranslation } from "react-i18next"

import { SupportContact } from "~/components/support/support-contact"
import { Button, Dialog, StatusList, type StatusListStatus } from "~/core"

export type RobotStoppingState = "moving" | "stopped" | "failed"

/**
 * The robot travelling to the stop position after an action stopped it
 * (restocking, manual replenishment, walk-in, layout send): one popup for
 * all of them, listing what it waits for. The lines never change wording;
 * only their icons do. The title changes only with the outcome:
 * - moving: blocking; staff stay out until it parks.
 * - stopped: every line done; shown briefly, then closes by itself.
 * - failed: the robot never reached the stop position; call, do not go in.
 */
export function RobotStoppingDialog({
  open,
  state,
  shelves,
  onClose,
}: {
  open: boolean
  state: RobotStoppingState
  /** Restocking and manual start also tilt the shelves; `null` when not. */
  shelves: StatusListStatus | null
  /** For `failed` only: the close icon and the button. */
  onClose: () => void
}) {
  const { t } = useTranslation(["app", "common"])
  const robot: StatusListStatus =
    state === "moving" ? "running" : state === "stopped" ? "done" : "failed"
  const items: StatusList.Item[] = [
    {
      key: "robot",
      label: t("workflow.robotStopping.stepRobot"),
      status: robot,
    },
    ...(shelves
      ? [
          {
            key: "shelves",
            label: t("workflow.robotStopping.stepShelves"),
            status: shelves,
          },
        ]
      : []),
  ]

  if (state === "failed") {
    return (
      <Dialog.Popup
        open={open}
        onClose={onClose}
        closeLabel={t("common:actions.close")}
        icon="error"
        title={t("workflow.robotStopping.failedTitle")}
        role="alertdialog"
        actions={
          <Dialog.Actions>
            <Button size="lg" onClick={onClose}>
              {t("common:actions.close")}
            </Button>
          </Dialog.Actions>
        }
      >
        <StatusList items={items} />
        <SupportContact message={t("workflow.robotStopping.failedBody")} />
      </Dialog.Popup>
    )
  }

  return (
    <Dialog.Popup
      open={open}
      role="alertdialog"
      title={t(
        state === "stopped"
          ? "workflow.robotStopping.stoppedTitle"
          : "workflow.robotStopping.title"
      )}
    >
      <StatusList items={items} />
      <p className="text-base text-secondary">
        {t(
          state === "stopped"
            ? "workflow.robotStopping.stoppedBody"
            : "workflow.robotStopping.autoClose"
        )}
      </p>
    </Dialog.Popup>
  )
}
