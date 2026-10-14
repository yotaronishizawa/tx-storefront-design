import { markNotificationChecked, setOperationModeByRobot } from "~/api/opm"
import { RobotOperationMode, type StoreNotification } from "~/api/opm/schemas"
import { readAppShellState, type PromptButtons } from "~/domains/app-shell"
import { translate } from "~/initializer/i18n"
import { playStoreAudio } from "~/utils/audio"

const NOTIFICATION_BUTTONS: Record<
  NonNullable<StoreNotification["type"]>,
  PromptButtons
> = {
  ChangeDisplayLayout: "notification-to-edit",
  RefillStock: "notification-to-restocking",
  Default: "notification-to-home",
}

/**
 * One notification from the operations centre: a chime and a heads-up, then
 * its text with a button to the page it is about.
 * It is marked checked once answered; a sign-out leaves it for next time.
 */
export async function showRobotNotification({
  notification,
  storeId,
  robotId,
  token,
}: {
  notification: StoreNotification
  storeId: string
  robotId: string
  token: string
}): Promise<void> {
  const shell = readAppShellState()
  const noticed = await shell.askOperatorWhenIdle(
    {
      buttons: "notification-check",
      home: false,
      message: translate("robotNotificationNotice"),
    },
    () => void playStoreAudio("notification")
  )
  if (noticed !== "confirm") {
    return
  }

  const type = notification.type ?? "Default"
  const answered = await shell.askOperator({
    buttons: NOTIFICATION_BUTTONS[type] ?? "notification-to-home",
    home: false,
    message: notification.description,
  })
  if (answered !== "confirm") {
    return
  }
  // Restocking expects the robot out of the way, so set the mode before going there.
  if (type === "RefillStock" && robotId) {
    await setOperationModeByRobot(
      robotId,
      RobotOperationMode.Restocking,
      token
    ).catch(() => false)
  }
  await markNotificationChecked(storeId, notification, token).catch(
    () => undefined
  )
}
