import type { RobotPositionControlsProps } from "~/components/robot/robot-position-controls"
import { useBusyAction } from "~/domains/app-shell"
import {
  useAutoPnpOperating,
  useRobotActions,
  useRobotOperationMode,
  useRobotStatusStale,
  useRobotWorkStatus,
} from "~/domains/robot"
import { useSelectedRobotId } from "~/domains/store-selection"
import { useOnlineStatus } from "~/hooks/use-online-status"
import { getRobotControls } from "~/model/robot-status"

export function useWorkflowRobotPosition(): RobotPositionControlsProps {
  const busyAction = useBusyAction()
  const robot = useSelectedRobotId()
  const workStatus = useRobotWorkStatus()
  const operationMode = useRobotOperationMode()
  const isOnline = useOnlineStatus()
  const statusStale = useRobotStatusStale()
  const robotOperating = useAutoPnpOperating()
  const actions = useRobotActions()
  const controls = getRobotControls({
    hasRobot: Boolean(robot),
    workStatus,
    operationMode,
    isOnline,
    statusStale,
    robotOperating,
    sessionInProgress: true,
  })
  return {
    enabled: controls.canMoveRestPosition,
    busyAction,
    onMoveTop: () => {
      void actions.moveRestPositionTop()
    },
    onMoveBottom: () => {
      void actions.moveRestPositionBottom()
    },
  }
}
