import { setRobotAutoPnp, setRobotRestPosition } from "../model/robot.mjs"
import { snapshot, state } from "../state.mjs"
import { readIntParam } from "../utils/params.mjs"
import { post } from "./route.mjs"

const DETECTORS = ["human", "obstacle", "fallenDrink"]

export const robotRoutes = [
  post("/sim/robot/rest-position", () => {
    setRobotRestPosition()
    return snapshot()
  }),
  post("/sim/robot/auto-pnp", () => {
    setRobotAutoPnp()
    return snapshot()
  }),
  post("/sim/robot/status", (params) => {
    state.robot.status = readIntParam(params, "value", 5)
    if (params.has("teleopCode")) {
      state.robot.teleopErrorCode = readIntParam(params, "teleopCode", 10)
    }
    return { ok: true, robot: state.robot }
  }),
  // `cause` = human | obstacle | fallenDrink | clear; `stopped=0` reports the
  // detection without it stopping the robot (staff inside while restocking).
  post("/sim/robot/detection", (params) => {
    const cause = params.get("cause") ?? "clear"
    const robot = state.robot
    robot.detection = Object.fromEntries(
      DETECTORS.map((name) => [name, name === cause])
    )
    robot.stoppedBy =
      DETECTORS.includes(cause) && params.get("stopped") !== "0" ? cause : null
    return { ok: true, robot }
  }),
  post("/sim/robot/e-stop", (params) => {
    state.robot.eStop = readIntParam(params, "value", 1)
    return { ok: true, robot: state.robot }
  }),
  post("/sim/robot/op-mode", (params) => {
    state.robot.opMode = readIntParam(params, "value", 31)
    return { ok: true, robot: state.robot }
  }),
]
