import type { WorkStatus } from "~/model/robot-status"

export type LayoutEntryBlock = "restocking" | "manual" | "teleoperation" | null

/** Why the layout editor cannot open now; the first match wins. */
export function getLayoutEntryBlock({
  restocking,
  manualReplenishment,
  workStatus,
}: {
  restocking: boolean
  manualReplenishment: boolean
  workStatus: WorkStatus
}): LayoutEntryBlock {
  if (restocking) {
    return "restocking"
  }
  if (manualReplenishment) {
    return "manual"
  }
  // A robot only asking for an operator is caught when the send parks it.
  if (workStatus === "Teleoperation") {
    return "teleoperation"
  }
  return null
}
