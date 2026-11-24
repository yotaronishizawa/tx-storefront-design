import { useTranslation } from "react-i18next"

import {
  ROBOT_MOVING_KINDS,
  ROBOT_STATUS_LABELS,
} from "~/components/robot/robot-status-label"
import {
  useAutoPnpOperating,
  useRobotAttention,
  useRobotOperationMode,
  useRobotStatusStale,
  useRobotWorkStatus,
} from "~/domains/robot"
import { useSelectedRobotId } from "~/domains/store-selection"
import { useOnlineStatus } from "~/hooks/use-online-status"
import { getRobotControls } from "~/model/robot-status"

export type RobotStatusTone = "moving" | "rest" | "cause"

/**
 * The robot's state in a word, for the header button: the same label and
 * colour rule as the idle screen (moving green, resting grey, a cause red).
 * A task staff could take on does not change it (Yotaro 2026-11-04).
 */
export function useRobotStatusBadge(): {
  label: string
  tone: RobotStatusTone
} {
  const { t } = useTranslation("app")
  const robotId = useSelectedRobotId()
  const workStatus = useRobotWorkStatus()
  const operationMode = useRobotOperationMode()
  const stale = useRobotStatusStale()
  const online = useOnlineStatus()
  const robotOperating = useAutoPnpOperating()
  const attention = useRobotAttention()

  const available = online && !stale && Boolean(robotId)
  const { kind } = getRobotControls({
    hasRobot: Boolean(robotId),
    workStatus,
    operationMode,
    isOnline: online,
    statusStale: stale,
    robotOperating,
    sessionInProgress: false,
  })
  const cause = attention?.cause && attention.level !== "assist"
  if (cause) return { label: t("workflow.home.attention.badge"), tone: "cause" }
  return {
    label: t(
      kind === "noRobot" || available
        ? ROBOT_STATUS_LABELS[kind]
        : ROBOT_STATUS_LABELS.unknown
    ),
    tone:
      available && ROBOT_MOVING_KINDS.has(kind) && attention?.level !== "assist"
        ? "moving"
        : "rest",
  }
}
