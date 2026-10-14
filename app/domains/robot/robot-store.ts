import { create } from "zustand"

import type { Robot } from "~/api/opm/schemas"
import {
  isAutoPnpOperating,
  type OperationMode,
  type WorkStatus,
} from "~/model/robot-status"

/** The robot as OPM last reported it. A poll replaces `robot` every `ROBOT_POLL_INTERVAL_MS`, so subscribe through the primitive selectors. */
type RobotState = {
  robot: Robot | null
  /** Polling failed repeatedly, so `robot` (and its `RestPosition`) cannot be trusted. */
  statusStale: boolean
}

type RobotActions = {
  clearRobot: () => void
  setRobot: (robot: Robot | null) => void
  setStatusStale: (statusStale: boolean) => void
}

const INITIAL_STATE: RobotState = {
  robot: null,
  statusStale: false,
}

export const useRobotStore = create<RobotState & RobotActions>((set) => ({
  ...INITIAL_STATE,

  clearRobot: () => set(INITIAL_STATE),
  setRobot: (robot) => set({ robot }),
  setStatusStale: (statusStale) => set({ statusStale }),
}))

export function selectRobotWorkStatus(state: RobotState): WorkStatus {
  return state.robot?.status ?? ""
}

/** What OPM last saw before the robot went offline. */
export function selectRobotStatusBeforeDisconnect(
  state: RobotState
): WorkStatus {
  return state.robot?.statusBeforeDisconnect ?? ""
}

export function selectRobotOperationMode(state: RobotState): OperationMode {
  return state.robot?.opMode ?? ""
}

export function selectAutoPnpOperating(state: RobotState): boolean {
  return isAutoPnpOperating(
    selectRobotWorkStatus(state),
    selectRobotOperationMode(state)
  )
}

export function readRobotState(): RobotState & RobotActions {
  return useRobotStore.getState()
}

export function resetRobotStore() {
  useRobotStore.setState(INITIAL_STATE)
}
