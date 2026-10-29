import { getRobotDetection, startRobotOperation } from "~/api/opm"
import { readStoreContext } from "~/domains/store-selection"
import type { RobotDetector } from "~/model/robot-attention"
import { delay } from "~/utils/poll"

import {
  readOperationsState,
  type RobotResumeFailure,
} from "../operations-store"
import { getActionResponseError } from "./action-results"

// Provisional: how often, and how far apart, the app retries a robot restart
// it started itself before handing the reason to staff. Agree with OPM.
export const ROBOT_RESUME_ATTEMPTS = 3
export const ROBOT_RESUME_INTERVAL_MS = 5000

/**
 * Restarts the robot after the app's own stop (end of a restock, manual
 * replenishment or walk-in), quietly retrying. On failure the last reason is
 * kept for the home "needs attention" panel; success clears it.
 */
export async function resumeRobotWithRetry(
  attempts = ROBOT_RESUME_ATTEMPTS
): Promise<boolean> {
  const context = readStoreContext()
  const robotId = context?.selectedStore.robotId
  if (!context || !robotId) {
    return false
  }
  const { markRestarted, setResumeFailure } = readOperationsState()
  let failure: RobotResumeFailure = "Unreachable"
  for (let attempt = 1; attempt <= attempts; attempt++) {
    if (attempt > 1) {
      await delay(ROBOT_RESUME_INTERVAL_MS)
    }
    try {
      const result = await startRobotOperation(robotId, context.session.token)
      const error = getActionResponseError("start-auto-pnp", result)
      if (!error) {
        markRestarted()
        return true
      }
      failure =
        error.kind === "failed" && isStartRobotError(error.error)
          ? error.error
          : error.kind === "robot-restart-failed"
            ? error.robotError
            : "ServerError"
    } catch {
      failure = "Unreachable"
    }
  }
  setResumeFailure(failure)
  return false
}

function isStartRobotError(name: string): name is RobotResumeFailure {
  return name !== "UnrecognizedResponse"
}

const DETECTOR_ORDER: RobotDetector[] = ["human", "obstacle"]

/**
 * What a detector sees right now, read fresh before handing the robot back.
 * `null` when nothing is seen, or when it cannot be read: the robot still
 * stops on its own if something is there.
 */
export async function findRestartBlocker(): Promise<RobotDetector | null> {
  const context = readStoreContext()
  const robotId = context?.selectedStore.robotId
  if (!context || !robotId) return null
  try {
    const { detected } = await getRobotDetection(robotId, context.session.token)
    return detected
      ? (DETECTOR_ORDER.find((detector) => detected[detector]) ?? null)
      : null
  } catch {
    return null
  }
}

/**
 * Restarts the robot unless a detector already sees something; then keeps
 * why, so Home shows it as soon as staff get there.
 */
export async function resumeRobotUnlessHeld(
  attempts = ROBOT_RESUME_ATTEMPTS
): Promise<boolean> {
  const blocker = await findRestartBlocker()
  if (blocker) {
    readOperationsState().setRestartHeldBy(blocker)
    return false
  }
  return resumeRobotWithRetry(attempts)
}
