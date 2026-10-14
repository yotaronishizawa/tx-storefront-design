import { createId } from "~/utils/id"
import { pollUntil } from "~/utils/poll"

import {
  CommandType,
  CurtainCommandControlType,
  GoToMotionCommandControlType,
  GoToMotionType,
  ProcessType,
  StartRobotCommandControlType,
  TaskResultResultType,
  TaskTypes,
  type AnyCommandBase,
  type OpmInput,
  type RobotOperationMode,
} from "../__generated__/opm-rpc"
import { call } from "../client"
import {
  readRobot,
  readRobotLiveDetection,
  readTeleoperationErrorCode,
} from "../schemas"

/** A code, not a sentence: the action runner translates it, since `api/` has no i18n. */
export const ROBOT_REST_POSITION_TIMEOUT = "RobotRestPositionTimeout"

/** Via `ListRobotsByIds`, because `GetRobotStatus` omits the `opMode` every restocking check reads. */
export async function getRobotStatus(robotId: string, token: string) {
  return readRobot(robotId, await call("ListRobotsByIds", [[robotId]], token))
}

/** Detectors, stop reason and e-stop: light enough to poll. */
export async function getRobotDetection(robotId: string, token: string) {
  return readRobotLiveDetection(
    await call("GetRobotLiveDataWithoutCameras", [robotId], token)
  )
}

/** The same plus both detection camera frames: heavy, so only while staff must act. */
export async function getRobotDetectionWithCameras(
  robotId: string,
  token: string
) {
  return readRobotLiveDetection(
    await call("GetRobotLiveData", [robotId], token)
  )
}

export async function setOperationModeByRobot(
  robotId: string,
  operationMode: RobotOperationMode,
  token: string
): Promise<boolean> {
  const result = await call(
    "SetOperationModeByRobot",
    [robotId, operationMode],
    token
  )
  return result === true
}

export function startRobotOperation(robotId: string, token: string) {
  return call("StartRobotOperation2", [robotId], token)
}

export function stopRobotOperation(robotId: string, token: string) {
  return call("StopRobotOperation2", [robotId], token)
}

const REST_POSITION_BY_TARGET = {
  top: GoToMotionType.RestPositionTop,
  bottom: GoToMotionType.RestPositionBottom,
} as const

// `Call` matches member names case-insensitively, so camelCase is enough.
function sendCommand(
  robotId: string,
  command: OpmInput<AnyCommandBase>,
  token: string
) {
  return call("SendRobotSystemCommand", [robotId, command], token)
}

/** Boots the robot software. Not the generated `StartRobot`: OPM aliases that name to `StartRobotOperation2`. */
export function startRobotSoftware(robotId: string, token: string) {
  return sendCommand(
    robotId,
    {
      type: CommandType.StartSystem,
      control: StartRobotCommandControlType.Start,
      target: [ProcessType.TxRobot],
      commandId: createId(),
    },
    token
  )
}

/** Why a robot in `RequestingTeleoperation` asks for help. */
export async function getTeleoperationErrorCode(
  robotId: string,
  token: string
) {
  return readTeleoperationErrorCode(
    await call("GetTaskContext", [robotId, TaskTypes.Teleoperation], token)
  )
}

/**
 * Withdraws the robot's teleoperation request, so a stop is no longer refused.
 * Rejects until OPM's SignalR JSON can read the abstract `TaskResult`.
 */
export async function cancelTeleoperationRequest(
  robotId: string,
  token: string
): Promise<void> {
  await call(
    "SubmitTaskResult",
    [
      robotId,
      {
        id: null,
        taskType: TaskTypes.Teleoperation,
        timestamp: Math.floor(Date.now() / 1000),
        result: TaskResultResultType.Failed,
      },
    ],
    token
  )
}

export function controlCurtain(robotId: string, open: boolean, token: string) {
  return sendCommand(
    robotId,
    {
      type: CommandType.ControlCurtain,
      control: open
        ? CurtainCommandControlType.OpenAll
        : CurtainCommandControlType.CloseAll,
      targetIds: null,
      commandId: createId(),
    },
    token
  )
}

function goToMotion(
  robotId: string,
  motionType: GoToMotionType,
  control: GoToMotionCommandControlType,
  token: string
) {
  return sendCommand(
    robotId,
    { type: CommandType.GoToMotion, control, motionType, skipCurtains: false },
    token
  )
}

/** Rejects if OPM refuses the command; there is no failure it reports by value. */
export async function goToRestPosition(
  robotId: string,
  token: string
): Promise<void> {
  await goToMotion(
    robotId,
    GoToMotionType.RestPosition,
    GoToMotionCommandControlType.ActionWithWait,
    token
  )
}

/** Releases the robot from its rest position, waits up to 30s for it to leave, then sends it to `target`. */
export async function moveRestPosition(
  robotId: string,
  target: "top" | "bottom",
  token: string
): Promise<boolean> {
  await goToMotion(
    robotId,
    GoToMotionType.None,
    GoToMotionCommandControlType.ReleaseWait,
    token
  )

  const released = await pollUntil(
    async () => {
      const robot = await getRobotStatus(robotId, token)
      return Boolean(robot && robot.status !== "RestPosition")
    },
    { retries: 10, intervalMs: 3000 }
  )
  if (!released) {
    throw new Error(ROBOT_REST_POSITION_TIMEOUT)
  }

  await goToMotion(
    robotId,
    REST_POSITION_BY_TARGET[target],
    GoToMotionCommandControlType.ActionWithWait,
    token
  )
  const arrived = await pollUntil(
    async () =>
      (await getRobotStatus(robotId, token))?.status === "RestPosition",
    { retries: 10, intervalMs: 3000 }
  )
  if (!arrived) throw new Error(ROBOT_REST_POSITION_TIMEOUT)
  return true
}
