import {
  useAutoPnpOperating,
  useRobotOperationMode,
  useRobotStatusStale,
  useRobotWorkStatus,
} from "~/domains/robot"
import { useSelectedRobotId } from "~/domains/store-selection"
import { useOnlineStatus } from "~/hooks/use-online-status"
import { getRobotControls } from "~/model/robot-status"

/**
 * True while the robot is out working, so starting a walk-in, restock or
 * take-out would stop it. Only then do those ask before stopping it.
 */
export function useRobotRunning(): boolean {
  const robotId = useSelectedRobotId()
  const workStatus = useRobotWorkStatus()
  const operationMode = useRobotOperationMode()
  const isOnline = useOnlineStatus()
  const statusStale = useRobotStatusStale()
  const robotOperating = useAutoPnpOperating()
  return getRobotControls({
    workStatus,
    operationMode,
    hasRobot: Boolean(robotId),
    isOnline,
    statusStale,
    robotOperating,
    sessionInProgress: false,
  }).canStop
}
