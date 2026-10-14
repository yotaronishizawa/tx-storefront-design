import type { DialogKind } from "~/domains/app-shell"
import {
  useManualReplenishmentActive,
  useRestockRequest,
} from "~/domains/operations"
import { useRobotWorkStatus } from "~/domains/robot"
import { isActiveRequest } from "~/model/request-state"
import { getLayoutEntryBlock } from "~/model/shelf"

export const LAYOUT_BLOCK_DIALOG = {
  restocking: "restocking-layout-block",
  manual: "manual-layout-block",
  teleoperation: "teleoperation-layout-block",
} as const satisfies Record<string, DialogKind>

export function useLayoutEntryBlockDialog(): DialogKind | null {
  const block = getLayoutEntryBlock({
    restocking: isActiveRequest(useRestockRequest()),
    manualReplenishment: useManualReplenishmentActive(),
    workStatus: useRobotWorkStatus(),
  })
  return block ? LAYOUT_BLOCK_DIALOG[block] : null
}
