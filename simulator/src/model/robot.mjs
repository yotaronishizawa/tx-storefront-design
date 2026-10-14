import { state } from "../state.mjs"

// `Robot.WorkStatus` and `Robot.OperationMode` (`Operation/Entities/TXAgents.cs`),
// named as `app/api/opm/schemas/robot.ts` names them.
export const WORK_STATUS = {
  offline: 0,
  notStartedYet: 1,
  standby: 2,
  automationPnpWorking: 3,
  restPosition: 5,
  automationCapture3d: 6,
  requestingTeleoperation: 9,
  teleoperation: 10,
  startingRobotSw: 11,
  failureToStartRobotSw: 12,
}
export const OPERATION_MODE = {
  processingPnpJob: 0,
  forceStopAutomatedJob: 3,
  maintenance: 4,
  restocking: 11,
  stoppedByStore: 31,
}
// OPM's `AllowRemoveDrink()` (`TXAgents.cs:288,296`): the modes and statuses
// in which `CheckIfCanRemoveSku` lets drinks be taken off.
export const DRINK_REMOVAL_MODES = [4, 11, 30, 31]
export const DRINK_REMOVAL_STATUSES = [
  WORK_STATUS.restPosition,
  WORK_STATUS.notStartedYet,
  WORK_STATUS.failureToStartRobotSw,
]

export function setRobotRestPosition() {
  state.robot.status = WORK_STATUS.restPosition
  state.robot.opMode = OPERATION_MODE.processingPnpJob
}

// OPM's stop parks the robot, then marks it stopped by the store
// (`PollForRestPositionThenSetStoppedByStore`); the app greys Stop out on that.
export function setRobotStoppedByStore() {
  state.robot.status = WORK_STATUS.restPosition
  state.robot.opMode = OPERATION_MODE.stoppedByStore
}

export function setRobotAutoPnp() {
  state.robot.status = WORK_STATUS.automationPnpWorking
  state.robot.opMode = OPERATION_MODE.processingPnpJob
}

export function toRobot() {
  return {
    id: state.robot.id,
    status: state.robot.status,
    statusBeforeDisconnect: WORK_STATUS.restPosition,
    opMode: state.robot.opMode,
  }
}
