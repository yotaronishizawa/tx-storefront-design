import {
  setRobotStoppedByStore,
  toRobot,
  WORK_STATUS,
} from "../model/robot.mjs"
import { startRobotWithCapture } from "../model/workflow.mjs"
import detectionCam1 from "../seed/assets/detection-cam1.jpg?inline"
import detectionCam2 from "../seed/assets/detection-cam2.jpg?inline"
import { state } from "../state.mjs"
import { withErrors } from "./define.mjs"
import {
  START_ROBOT_OPERATION_ERRORS,
  STOP_ROBOT_OPERATION_ERRORS,
} from "./errors.mjs"

// `CommandType` (`RobotSystem/Entities/RobotSystem.cs`) values this simulator
// acts on. `remoteRos` (pause/resume, gripper) has no robot to reach, so it is
// only acknowledged.
const SYSTEM_COMMAND = {
  startSystem: 1,
  goToMotion: 3,
  curtain: 4,
  remoteRos: 5,
}
// How long "starting the robot software" lasts before the robot is up.
const ROBOT_SW_START_MS = 2000
// The arm's vertical joint as `sensor_msgs/JointState` would report it.
// Provisional (joint name, heights): to confirm with the robot team.
const ARM_LIFT = {
  joint: "lift_joint",
  bottom: 0.05,
  top: 1.15,
  travelMs: 4000,
  stepMs: 200,
}
// `GoToMotionType`: 1 RestPositionBottom, 2 RestPositionTop.
const ARM_TARGET_BY_MOTION = { 1: ARM_LIFT.bottom, 2: ARM_LIFT.top }
let armTimer = null
// `TaskTypes.Teleoperation`.
const TELEOPERATION_TASK = 3

// `Entities/Robot/RobotLiveData.cs`: every field is a JSON-serialized ROS
// message, or null when the robot has not reported it. The simulator reports
// only the detectors, stop reason, e-stop, the arm's lift joint and the
// detection cameras.
const ROBOT_LIVE_DATA_FIELDS = [
  "serializedJointStates",
  "serializedHandCamRgb0",
  "serializedHandCamRgb1",
  "serializedHandCamRgb2",
  "serializedOverloadStates",
  "serializedCollisionStates",
  "serializedCollisionLink",
  "serializedJointsMonitor",
  "serializedHardwareJoints",
  "serializedBumperState",
  "serializedBumperData",
  "serializedTxDriverError",
  "teleopAggregatedMessage",
  "teleopUpdatedMessage",
  "humanDetectionResult",
  "humanDetectionEnabled",
  "serializedHumanDetectionCamRgb1",
  "serializedHumanDetectionCamRgb2",
  "serializedHandEyeCameraCalibrationResult",
  "wristHorizontalAlignmentResult",
  "serializedConfigureDeploymentStatus",
  "serializedExecutionStatus",
  "robotVisionRois",
  "robotWristRpy",
  "eStopTriggered",
  "serializedTeleoperationCam",
  "stopStatus",
  "eStopStatus",
]

// Vite inlines each frame as a data URL; OPM sends the bare base64.
const DETECTION_FRAMES = { 1: detectionCam1, 2: detectionCam2 }
const detectionCameraJpeg = (camera) =>
  (DETECTION_FRAMES[camera] ?? "").replace(/^data:[^,]*,/, "")

/** A ROS `std_msgs/Header`, as `System.Text.Json` writes RosSharp's. */
function rosHeader(now) {
  const secs = Math.floor(now / 1000)
  return {
    seq: 0,
    stamp: { secs, nsecs: (now % 1000) * 1_000_000 },
    frame_id: "",
  }
}

/**
 * The detector fields as OPM fills them (`RobotLiveData.cs`): each is a
 * `JsonSerializer.Serialize` string — `HumanObstacleDetection` keeps its ROS
 * snake_case names, `RobotStopStatusDto` its PascalCase ones, and the e-stop is
 * a `std_msgs/UInt8`. Camera 1 sees what is detected; camera 2 sees nothing.
 */
function robotLiveData({ cameras }) {
  const now = Date.now()
  const { detection, stoppedBy, eStop } = state.robot
  const stamp = rosHeader(now).stamp
  const fields = {
    humanDetectionResult: JSON.stringify({
      header: rosHeader(now),
      success: true,
      camera_timestamps: [stamp, stamp],
      human_present: [detection.human, false],
      obstacle_present: [detection.obstacle, false],
      fallen_drink_present: [detection.fallenDrink, false],
      human_presence_hist: detection.human,
    }),
    humanDetectionEnabled: JSON.stringify({ data: true }),
    stopStatus: JSON.stringify({
      StoppedDueToHuman: stoppedBy === "human",
      StoppedDueToObstacle: stoppedBy === "obstacle",
      StoppedDueToFallenDrink: stoppedBy === "fallenDrink",
    }),
    eStopStatus: JSON.stringify({ data: eStop }),
    eStopTriggered: JSON.stringify({ data: eStop === 1 }),
    serializedJointStates: JSON.stringify({
      header: rosHeader(now),
      name: [ARM_LIFT.joint],
      position: [state.robot.armHeight ?? ARM_LIFT.bottom],
      velocity: [],
      effort: [],
    }),
  }
  if (cameras) {
    for (const camera of [1, 2]) {
      fields[`serializedHumanDetectionCamRgb${camera}`] = JSON.stringify({
        header: rosHeader(now),
        format: "jpeg",
        data: detectionCameraJpeg(camera),
      })
    }
  }
  return {
    ...Object.fromEntries(ROBOT_LIVE_DATA_FIELDS.map((field) => [field, null])),
    ...fields,
  }
}

export const robotMethods = {
  GetRobotStatus: () => state.robot.status,
  GetRobots: () => [toRobot()],
  ListRobotsByIds: ([robotIds]) => {
    const ids = Array.isArray(robotIds) ? robotIds.map(String) : []
    return ids.includes(state.robot.id) ? [toRobot()] : []
  },
  GetRobotLiveData: () => robotLiveData({ cameras: true }),
  GetRobotLiveDataWithoutCameras: () => robotLiveData({ cameras: false }),

  SetOperationModeByRobot: ([, opMode]) => {
    state.robot.opMode = Number(opMode ?? 0)
    return true
  },

  // The obsolete v1 pair answers a bare bool (`RpcGateway.Store.cs:41,43`).
  StartRobotOperation: () => {
    return startRobotWithCapture().error === 0
  },
  StopRobotOperation: () => {
    setRobotStoppedByStore()
    return true
  },
  // Also answers as `StartRobot` / `StopRobot`, OPM aliases.
  // `ResolveShelfLayoutRequestBeforeRobotStart`: with no capture to run, the layout change closes.
  StartRobotOperation2: withErrors(
    () => {
      return startRobotWithCapture()
    },
    START_ROBOT_OPERATION_ERRORS,
    (error) => ({ error })
  ),
  StopRobotOperation2: withErrors(
    () => {
      setRobotStoppedByStore()
      return { error: 0 }
    },
    STOP_ROBOT_OPERATION_ERRORS,
    (error) => ({ error })
  ),

  // OPM answers `null` whatever the command (`TXOperationService.SendRobotSystemCommand`).
  SendRobotSystemCommand: ([, command]) => {
    applyRobotSystemCommand(command ?? {})
    return null
  },

  // The teleoperation the robot is asking for, while it asks (`WorkStatus` 9).
  // `message` is the robot's JSON, its code a numeric string.
  GetTaskContext: ([robotId]) =>
    Number(state.robot.status) === WORK_STATUS.requestingTeleoperation
      ? {
          agentId: String(robotId ?? state.robot.id),
          taskType: TELEOPERATION_TASK,
          message: JSON.stringify({
            code: String(state.robot.teleopErrorCode ?? 0),
            message: "Simulated teleoperation request",
          }),
        }
      : null,
  // OPM relays the result to the robot, which then reports its next status;
  // the simulator's robot goes back to standby. OPM cannot read this argument
  // over SignalR today: `TaskResult` is abstract and has no JSON converter.
  SubmitTaskResult: () => {
    if (isTeleoperationStatus(Number(state.robot.status))) {
      state.robot.status = WORK_STATUS.standby
    }
    return null
  },
}

function isTeleoperationStatus(status) {
  return (
    status === WORK_STATUS.requestingTeleoperation ||
    status === WORK_STATUS.teleoperation
  )
}

function applyRobotSystemCommand(command) {
  const type = Number(command.type ?? 0)
  const control = Number(command.control ?? 0)
  if (type === SYSTEM_COMMAND.curtain) {
    state.curtainsOpen = control === 1
    return
  }
  if (type === SYSTEM_COMMAND.startSystem) {
    startRobotSoftware()
    return
  }
  if (type === SYSTEM_COMMAND.goToMotion) {
    state.robot.status =
      control === 1 ? WORK_STATUS.standby : WORK_STATUS.restPosition
    const target = ARM_TARGET_BY_MOTION[Number(command.motionType)]
    if (target !== undefined) moveArm(target)
  }
}

/** Slides the arm to `target` over `ARM_LIFT.travelMs`, as a real move takes time. */
function moveArm(target) {
  clearInterval(armTimer)
  const from = state.robot.armHeight ?? ARM_LIFT.bottom
  const steps = Math.max(1, Math.round(ARM_LIFT.travelMs / ARM_LIFT.stepMs))
  let step = 0
  armTimer = setInterval(() => {
    step += 1
    state.robot.armHeight = from + ((target - from) * step) / steps
    if (step >= steps) clearInterval(armTimer)
  }, ARM_LIFT.stepMs)
}

/** `StartRobotCommand`: starting, then standing by once the software is up. */
function startRobotSoftware() {
  state.robot.status = WORK_STATUS.startingRobotSw
  setTimeout(() => {
    if (Number(state.robot.status) === WORK_STATUS.startingRobotSw) {
      state.robot.status = WORK_STATUS.standby
    }
  }, ROBOT_SW_START_MS)
}
