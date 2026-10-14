import type { OperationMode, WorkStatus } from "~/model/robot-status"

import {
  selectAutoPnpOperating,
  selectRobotOperationMode,
  selectRobotWorkStatus,
  useRobotStore,
} from "./robot-store"

// Primitive results, so a poll reporting an unchanged robot re-renders nothing.
export function useRobotWorkStatus(): WorkStatus {
  return useRobotStore(selectRobotWorkStatus)
}

export function useRobotOperationMode(): OperationMode {
  return useRobotStore(selectRobotOperationMode)
}

export function useAutoPnpOperating(): boolean {
  return useRobotStore(selectAutoPnpOperating)
}

export function useRobotStatusStale(): boolean {
  return useRobotStore((state) => state.statusStale)
}
