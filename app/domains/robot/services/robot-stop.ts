import {
  cancelTeleoperationRequest,
  getRobotStatus,
  getTeleoperationErrorCode,
  requestOperatorTask,
} from "~/api/opm"
import type { Robot } from "~/api/opm/schemas"
import { readAppShellState, type PromptPhoto } from "~/domains/app-shell"
import { runBusy } from "~/domains/operations"
import { translate } from "~/initializer/i18n"
import {
  canStoreFixTeleopError,
  isTeleoperationStatus,
} from "~/model/robot-status"
import { pollUntil } from "~/utils/poll"

// Always English: the operations centre reads them, whatever the app language.
const REST_POSITION_TASK = {
  name: "RobotToRestPosition",
  title: "Robot to Rest Position",
  description: "Store Staff requested robot to rest position",
} as const

// About 30 seconds for the request to clear.
const TELEOPERATION_CLEAR_WAIT = { retries: 10, intervalMs: 3000 }

const PHOTO_ROOT = "/assets/robot-stop"

// Each step's popup says whether it worked, so no error banner on top of it.
const NO_BANNER = { formatError: () => "" }

/**
 * Asks the operations centre to park the robot, then says whether it could.
 * An operator is driving it, or its error needs one.
 */
export async function requestOperatorStop(
  storeId: string,
  token: string
): Promise<void> {
  const requested = await runBusy(
    "teleoperation-stop",
    async () => {
      await requestOperatorTask(storeId, REST_POSITION_TASK, token)
      return true
    },
    NO_BANNER
  )
  await readAppShellState().askOperator({
    buttons: "ok",
    home: true,
    message: translate(
      requested ? "robotStopWaitOperatorNotice" : "robotStopRequestFailedNotice"
    ),
  })
}

/**
 * The robot is asking for an operator. If staff can fix the cause, they run a
 * checklist, the request is withdrawn and `stop` runs; otherwise, or when the
 * withdrawal fails, the operations centre is asked to park it.
 */
export async function stopWhileRequestingTeleoperation({
  robotId,
  storeId,
  hwModel,
  token,
  stop,
}: {
  robotId: string
  storeId: string
  hwModel: Robot["hwModel"]
  token: string
  stop: () => Promise<unknown>
}): Promise<void> {
  // An unreadable code counts as one staff cannot fix.
  const code = await runBusy(
    "teleoperation-stop",
    () => getTeleoperationErrorCode(robotId, token),
    NO_BANNER
  )
  if (!code || !canStoreFixTeleopError(code)) {
    await requestOperatorStop(storeId, token)
    return
  }

  const shell = readAppShellState()
  const confirmed = await shell.askOperator({
    buttons: "stop-cancel",
    home: false,
    message: translate("robotStopOperatorScheduledConfirm"),
  })
  if (confirmed !== "confirm") {
    return
  }
  const checked = await shell.askOperator({
    buttons: "checklist-ok",
    home: false,
    message: translate("robotStopChecklist"),
    photos: getChecklistPhotos(hwModel),
  })
  if (checked !== "confirm") {
    return
  }

  const cancelled = await runBusy(
    "teleoperation-stop",
    async () => {
      await cancelTeleoperationRequest(robotId, token)
      // OPM refuses a stop while the request stands; stop anyway once the wait ends.
      await pollUntil(async () => {
        const status = (await getRobotStatus(robotId, token))?.status ?? ""
        return !isTeleoperationStatus(status)
      }, TELEOPERATION_CLEAR_WAIT)
      return true
    },
    NO_BANNER
  )
  if (!cancelled) {
    await requestOperatorStop(storeId, token)
    return
  }
  await stop()
}

function getChecklistPhotos(hwModel: Robot["hwModel"]): PromptPhoto[] {
  const ghost = hwModel === "Ghost" ? "-ghost" : ""
  return [
    {
      src: `${PHOTO_ROOT}/fallen-drink.jpg`,
      alt: translate("robotStopCheckFallenDrink"),
    },
    {
      src: `${PHOTO_ROOT}/held-drink${ghost}.jpg`,
      alt: translate("robotStopCheckHeldDrink"),
    },
    {
      src: `${PHOTO_ROOT}/rail-object${ghost}.jpg`,
      alt: translate("robotStopCheckRailObject"),
    },
  ]
}
