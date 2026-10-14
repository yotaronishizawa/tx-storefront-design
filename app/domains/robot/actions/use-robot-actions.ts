import type { ParseKeys } from "i18next"

import {
  controlCurtain,
  moveRestPosition,
  requestOperatorTask,
  setAllShelfLanesAvailable,
  startRobotSoftware,
} from "~/api/opm"
import { createLogger } from "~/config/logger"
import { readAppShellState } from "~/domains/app-shell"
import { useStoreActionRunner } from "~/domains/operations"
import { useSession } from "~/domains/session"
import { useSelectedRobotId, useSelectedStore } from "~/domains/store-selection"
import { translate } from "~/initializer/i18n"
import type { StoreAction } from "~/types/busy-action"

import { readRobotState } from "../robot-store"
import {
  refreshRobotState,
  startRobotOperationWithFallback,
  stopRobotOperationWithFallback,
} from "../services/robot-operations"
import { checkShelvesBeforeStart } from "../services/robot-start"
import {
  requestOperatorStop,
  stopWhileRequestingTeleoperation,
} from "../services/robot-stop"

const logger = createLogger("Robot Actions")

/**
 * Direct robot commands: auto PNP, the curtains, and the rest position.
 * `startRobot`, `stopRobot` and the curtains ask first; the
 * `*AutoPnpOperation` pair sends straight away.
 */
export function useRobotActions() {
  const runAction = useStoreActionRunner()
  const session = useSession()
  const selectedRobotId = useSelectedRobotId()
  const selectedStore = useSelectedStore()

  function confirm(
    message: ParseKeys<"app">,
    buttons: "yes-no" | "restart-no" = "yes-no"
  ): Promise<boolean> {
    return readAppShellState()
      .askOperator({ buttons, home: false, message: translate(message) })
      .then((choice) => choice === "confirm")
  }

  async function runRobotCommand(
    action: StoreAction,
    command: (robotId: string, token: string) => Promise<unknown>,
    successNotice = true
  ): Promise<boolean> {
    if (!session || !selectedRobotId) {
      return false
    }
    return runAction(action, () => command(selectedRobotId, session.token), {
      successNotice,
    })
  }

  function startAutoPnpOperation(): Promise<boolean> {
    return runRobotCommand("start-auto-pnp", async (robotId, token) => {
      const result = await startRobotOperationWithFallback(robotId, token)
      return requireAccepted(result, "robotAutoPnpStartRejected")
    })
  }

  function stopAutoPnpOperation(): Promise<boolean> {
    const storeId = selectedStore?.id
    return runRobotCommand("stop-auto-pnp", async (robotId, token) => {
      if (storeId) {
        await setAllShelfLanesAvailable(storeId, token).catch((caught) =>
          logger.warn("Turning the lanes back on before a stop failed.", caught)
        )
      }
      const result = await stopRobotOperationWithFallback(robotId, token)
      // So the stop button disables before the next poll.
      await refreshRobotState(robotId, token)
      return requireAccepted(result, "robotAutoPnpStopRejected")
    })
  }

  /** The start button: the shelf check, then booting the software or starting auto PNP. */
  async function startRobot(): Promise<void> {
    if (!session) {
      return
    }
    if (!(await checkShelvesBeforeStart(selectedStore, session.token))) {
      return
    }
    if (readRobotState().robot?.status === "NotStartedYet") {
      await bootRobotSoftware()
      return
    }
    if (await confirm("robotStartConfirm", "restart-no")) {
      await startAutoPnpOperation()
    }
  }

  async function bootRobotSoftware(): Promise<void> {
    if (!(await confirm("robotBootConfirm"))) {
      return
    }
    await readAppShellState().askOperator({
      buttons: "ok",
      home: false,
      message: translate("robotBootLeaveWalkInNotice"),
    })
    if (session && selectedStore) {
      // Tells the operations centre to watch the boot; the boot never waits on it.
      void requestOperatorTask(
        selectedStore.id,
        {
          name: "StoreRequest",
          title: translate("robotBootOperatorTaskTitle"),
          description: translate("robotBootOperatorTaskDescription"),
        },
        session.token
      ).catch(() => undefined)
    }
    await runRobotCommand("start-robot-software", startRobotSoftware)
  }

  /** The stop button, which hands a robot under operator control to its own flow. */
  async function stopRobot(): Promise<void> {
    const robot = readRobotState().robot
    if (!session || !selectedStore || !robot) {
      return
    }
    if (robot.status === "Teleoperation") {
      await requestOperatorStop(selectedStore.id, session.token)
      return
    }
    if (robot.status === "RequestingTeleoperation") {
      await stopWhileRequestingTeleoperation({
        robotId: robot.id,
        storeId: selectedStore.id,
        hwModel: robot.hwModel,
        token: session.token,
        stop: stopAutoPnpOperation,
      })
      return
    }
    if (await confirm("robotStopConfirm")) {
      await stopAutoPnpOperation()
    }
  }

  /**
   * Not offered anywhere in the UI, on purpose: the curtains open and close
   * inside the manual replenishment track (OPM does it on Start/End), so
   * there is no separate curtain control. Kept for parity with the store app.
   */
  async function moveCurtains(action: StoreAction, open: boolean) {
    if (!(await confirm(open ? "curtainOpenConfirm" : "curtainCloseConfirm"))) {
      return
    }
    await runRobotCommand(action, (robotId, token) =>
      controlCurtain(robotId, open, token)
    )
  }

  /** `quiet` skips the "sent" notice, for a caller that shows the move itself. */
  async function moveToRestPosition(
    action: StoreAction,
    position: "top" | "bottom",
    quiet = false
  ): Promise<boolean> {
    return runRobotCommand(
      action,
      (robotId, token) => moveRestPosition(robotId, position, token),
      !quiet
    )
  }

  return {
    closeCurtains: () => moveCurtains("curtains-down", false),
    moveRestPositionBottom: (quiet?: boolean) =>
      moveToRestPosition("rest-position-bottom", "bottom", quiet),
    moveRestPositionTop: (quiet?: boolean) =>
      moveToRestPosition("rest-position-top", "top", quiet),
    openCurtains: () => moveCurtains("curtains-up", true),
    startAutoPnpOperation,
    startRobot,
    stopAutoPnpOperation,
    stopRobot,
  }
}

/** An object answer goes on to be decoded; anything else is a bare accepted flag. */
function requireAccepted(
  result: unknown,
  rejectedKey: "robotAutoPnpStartRejected" | "robotAutoPnpStopRejected"
): unknown {
  if (result && typeof result === "object") {
    return result
  }
  if (!result) {
    throw new Error(translate(rejectedKey))
  }
  return true
}
