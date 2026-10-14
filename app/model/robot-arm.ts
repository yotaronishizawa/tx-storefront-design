export type RobotArmPosition = "top" | "bottom"

// Provisional heights (metres) of the arm's lift joint: within a few
// centimetres of an end counts as there. To confirm with the robot team.
const ARM_TOP_MIN = 1.1
const ARM_BOTTOM_MAX = 0.1

/**
 * Which end of its rail the arm is at, from the lift joint height; `null`
 * while it travels between them or the height is not reported.
 *
 * @example toRobotArmPosition(1.15) // "top"
 * @example toRobotArmPosition(0.05) // "bottom"
 * @example toRobotArmPosition(0.6) // null
 */
export function toRobotArmPosition(
  height: number | null
): RobotArmPosition | null {
  if (height === null) return null
  if (height >= ARM_TOP_MIN) return "top"
  if (height <= ARM_BOTTOM_MAX) return "bottom"
  return null
}
