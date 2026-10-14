import { state } from "../state.mjs"
import { findActiveRequest, REQUEST_TYPE } from "./requests.mjs"
import { OPERATION_MODE, setRobotAutoPnp, WORK_STATUS } from "./robot.mjs"

/** OPM 42444d5: restart is the capture gate. Accepted does not mean automatic PNP. */
export function startRobotWithCapture() {
  if (state.restartError) return { error: state.restartError }
  if (findActiveRequest(REQUEST_TYPE.restocking)) return { error: 9 }
  if (findActiveRequest(REQUEST_TYPE.manualReplenishment)) return { error: 12 }
  if (findActiveRequest(REQUEST_TYPE.annotation)) return { error: 6 }
  const layout = findActiveRequest(REQUEST_TYPE.shelfLayoutChange)
  if (layout) {
    layout.captureJobPublished = true
    layout.captureJobId = `SIM-CAPTURE-${layout.requestId}`
    state.robot.status = WORK_STATUS.automationCapture3d
    state.robot.opMode = OPERATION_MODE.forceStopAutomatedJob
    return { error: 0 }
  }
  setRobotAutoPnp()
  return { error: 0 }
}
