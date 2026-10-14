import type { OpmShelfLocation, RequestContext } from "~/api/opm/schemas"
import { FEATURES } from "~/config/feature"

import {
  selectLayoutChangeInitialDisplayLocations,
  selectManualReplenishmentActive,
  selectManualReplenishmentId,
  selectManualReplenishmentRequest,
  selectRestockRequest,
  selectStoreTaskOpen,
  useOperationsStore,
} from "./operations-store"

const NO_LOCATIONS: OpmShelfLocation[] = []

export function useRestockRequest(): RequestContext | undefined {
  return useOperationsStore(selectRestockRequest)
}

export function useManualReplenishmentRequest(): RequestContext | undefined {
  return useOperationsStore(selectManualReplenishmentRequest)
}

export function useManualReplenishmentId(): string {
  return useOperationsStore(selectManualReplenishmentId)
}

export function useManualReplenishmentActive(): boolean {
  return useOperationsStore(selectManualReplenishmentActive)
}

export function useStoreTaskOpen(): boolean {
  return useOperationsStore(selectStoreTaskOpen)
}

/** The display lanes as they stood when the open layout change was requested; empty without one. */
export function usePendingLayoutInitialLocations(): OpmShelfLocation[] {
  return useOperationsStore(selectLayoutChangeInitialDisplayLocations)
}

/** The open layout change's starting display lanes, for /display's temporary entry; empty while the feature is off. */
export function useTemporaryDisplayLocations(): OpmShelfLocation[] {
  const locations = useOperationsStore(
    selectLayoutChangeInitialDisplayLocations
  )
  return FEATURES.temporaryDisplayLayout ? locations : NO_LOCATIONS
}

/** Why the app's own robot restart failed after retries, if it did. */
export function useRobotResumeFailure() {
  return useOperationsStore((state) => state.resumeFailure)
}

/** When the app last restarted the robot after a task or walk-in. */
export function useRobotRestartedAt() {
  return useOperationsStore((state) => state.restartedAt)
}

/** What a detector saw when staff handed the robot back, if the app held the restart. */
export function useRobotRestartHeldBy() {
  return useOperationsStore((state) => state.restartHeldBy)
}
