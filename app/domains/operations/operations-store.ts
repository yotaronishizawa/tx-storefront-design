import { create } from "zustand"

import type {
  OpmShelfLocation,
  RequestContext,
  RobotLiveDetector,
  StartRobotOperationErrorsName,
} from "~/api/opm/schemas"
import { isActiveRequest } from "~/model/request-state"

/** The store's open OPM requests, refreshed on a 5s poll and after every action. */
type OperationsState = {
  requests: RequestContext[]
  /**
   * Why the robot did not resume after the app itself tried to restart it
   * (end of a restock, manual replenishment or walk-in), after automatic
   * retries. `Unreachable` when OPM never answered. Cleared once it works again.
   */
  resumeFailure: RobotResumeFailure | null
  /** When the app last restarted the robot after a restock, manual replenishment or walk-in. */
  restartedAt: number | null
  /**
   * A detector saw something when staff handed the robot back, so the app did
   * not restart it; staff clear it and try again.
   */
  restartHeldBy: RobotLiveDetector | null
}

export type RobotResumeFailure = StartRobotOperationErrorsName | "Unreachable"

type OperationsActions = {
  /** Drops a request OPM has just closed, without waiting for the next refresh. */
  forgetRequest: (requestId: string) => void
  setRequests: (requests: RequestContext[]) => void
  setResumeFailure: (resumeFailure: RobotResumeFailure | null) => void
  markRestarted: () => void
  setRestartHeldBy: (detector: RobotLiveDetector | null) => void
}

const INITIAL_STATE: OperationsState = {
  requests: [],
  resumeFailure: null,
  restartedAt: null,
  restartHeldBy: null,
}

const NO_LOCATIONS: OpmShelfLocation[] = []

export const useOperationsStore = create<OperationsState & OperationsActions>(
  (set) => ({
    ...INITIAL_STATE,
    forgetRequest: (requestId) =>
      set((state) => ({
        requests: state.requests.filter(
          (request) => request.requestId !== requestId
        ),
      })),
    setRequests: (requests) => set({ requests }),
    setResumeFailure: (resumeFailure) => set({ resumeFailure }),
    markRestarted: () =>
      set({
        restartedAt: Date.now(),
        resumeFailure: null,
        restartHeldBy: null,
      }),
    setRestartHeldBy: (restartHeldBy) => set({ restartHeldBy }),
  })
)

export function selectRestockRequest(
  state: OperationsState
): RequestContext | undefined {
  return state.requests.find((request) => request.requestType === "Restock")
}

export function selectManualReplenishmentRequest(
  state: OperationsState
): RequestContext | undefined {
  return state.requests.find(
    (request) => request.requestType === "ManualReplenishment"
  )
}

export function selectLayoutChangeRequest(
  state: OperationsState
): RequestContext | undefined {
  return state.requests.find(
    (request) => request.requestType === "ShelfLayoutChange"
  )
}

/** The display lanes as they stood when the open layout change was requested; empty without one. */
export function selectLayoutChangeInitialDisplayLocations(
  state: OperationsState
): OpmShelfLocation[] {
  const request = selectLayoutChangeRequest(state)
  return request && isActiveRequest(request)
    ? request.initialDisplayShelfLocations
    : NO_LOCATIONS
}

export function selectManualReplenishmentId(state: OperationsState): string {
  return selectManualReplenishmentRequest(state)?.requestId ?? ""
}

/** Open, as opposed to merely present: a closed task must not prompt again. */
export function selectManualReplenishmentActive(
  state: OperationsState
): boolean {
  return isActiveRequest(selectManualReplenishmentRequest(state))
}

/** A restock, manual replenishment or layout change is open: the tasks this app drives. */
export function selectStoreTaskOpen(state: OperationsState): boolean {
  return [
    selectRestockRequest(state),
    selectManualReplenishmentRequest(state),
    selectLayoutChangeRequest(state),
  ].some(isActiveRequest)
}

export function readOperationsState(): OperationsState & OperationsActions {
  return useOperationsStore.getState()
}

export function resetOperationsStore() {
  useOperationsStore.setState(INITIAL_STATE)
}
