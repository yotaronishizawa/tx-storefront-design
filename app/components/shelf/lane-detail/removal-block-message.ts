import type { StockRemovalBlock } from "~/model/robot-status"

/** Why drinks cannot be removed right now, in the operator's words. */
export const REMOVAL_BLOCK_MESSAGE_KEYS = {
  PnpInProgress: "removeBlockedRobotBusy",
  RestockingInProgress: "removeBlockedRestocking",
  RobotNotAtRest: "removeBlockedRobotAway",
} as const satisfies Record<Exclude<StockRemovalBlock, "">, string>
