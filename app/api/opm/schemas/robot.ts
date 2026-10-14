import { z } from "zod"

import {
  HardwareModel,
  RobotOperationMode,
  RobotWorkStatus,
  TeleopErrorCode,
  type TeleopErrorCodeName,
} from "../__generated__/opm-rpc"
import { enumName, enumNameOf, list, parse, text } from "../../shared/fields"

const robotSchema = z.looseObject({
  id: z.string(),
  // Picks the stop checklist photos.
  hwModel: enumName(HardwareModel),
  opMode: enumName(RobotOperationMode),
  status: enumName(RobotWorkStatus),
  statusBeforeDisconnect: enumName(RobotWorkStatus),
})

export type Robot = z.output<typeof robotSchema>

/** `ListRobotsByIds` answers a list even for one id, and an empty one for an unknown id. */
export function readRobot(robotId: string, value: unknown): Robot | null {
  const robots = list(robotSchema, "robots").parse(value)
  return robots.find((robot) => robot.id === robotId) ?? null
}

const taskContextSchema = z.looseObject({ message: text })

/**
 * The teleoperation error a robot is asking help for, from `GetTaskContext`.
 * Its `message` is JSON carrying the code as a numeric string; an unreadable
 * code reads as `ServerCrashed`.
 *
 * @example readTeleoperationErrorCode({ message: '{"code":"10"}' }) // "FailedToGraspAtStock"
 * @example readTeleoperationErrorCode(null) // "None"
 */
export function readTeleoperationErrorCode(
  value: unknown
): TeleopErrorCodeName {
  const message = parse(taskContextSchema, value, "task context")?.message
  if (!message) {
    return "None"
  }
  const code = /"code"\s*:\s*"(\d+)"/.exec(message)?.[1]
  return enumNameOf(
    TeleopErrorCode,
    code === undefined ? TeleopErrorCode.ServerCrashed : Number(code)
  )
}
