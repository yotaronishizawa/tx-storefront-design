import {
  canCancelShelfLayoutChangeRequest,
  cancelShelfLayoutChangeRequest,
} from "~/api/opm"
import {
  readOperationsState,
  refreshRequests,
  runBusy,
  selectLayoutChangeRequest,
  selectManualReplenishmentActive,
  selectRestockRequest,
} from "~/domains/operations"
import {
  readRobotState,
  refreshRobotState,
  selectRobotWorkStatus,
} from "~/domains/robot"
import { useStoreContext } from "~/domains/store-selection"
import { translate } from "~/initializer/i18n"
import { isActiveRequest } from "~/model/request-state"
import { getLayoutEntryBlock, type LayoutEntryBlock } from "~/model/shelf"
import { getStoreRobotId } from "~/model/store-display"

import { readPendingLayout } from "../storage/pending-layout-storage"

type PendingLayoutChange = "none" | "cancellable" | "locked"

type LayoutEntryCheck =
  | { kind: "blocked"; block: NonNullable<LayoutEntryBlock> }
  | { kind: "pending"; pending: Exclude<PendingLayoutChange, "none"> }
  | { kind: "clear" }

/** OPM allows one open layout change per store. */
export function useLayoutRequestActions() {
  const context = useStoreContext()

  // Fresh reads: after a reload the polls have not caught up yet.
  async function checkLayoutEntry(): Promise<LayoutEntryCheck> {
    // A reload may enter before the shelf store hydrates its submitted snapshot.
    // Reconcile that known submission instead of offering to cancel and send again.
    if (context && readPendingLayout(context.selectedStore.id))
      return { kind: "clear" }
    await Promise.all([
      refreshRequests().catch(() => undefined),
      refreshRobotStatus(),
    ])

    const operations = readOperationsState()
    const block = getLayoutEntryBlock({
      restocking: isActiveRequest(selectRestockRequest(operations)),
      manualReplenishment: selectManualReplenishmentActive(operations),
      workStatus: selectRobotWorkStatus(readRobotState()),
    })
    if (block) {
      return { kind: "blocked", block }
    }

    const pending = await checkPendingLayoutChange()
    return pending === "none" ? { kind: "clear" } : { kind: "pending", pending }
  }

  async function refreshRobotStatus() {
    const robotId = context ? getStoreRobotId(context.selectedStore) : ""
    if (context && robotId) {
      await refreshRobotState(robotId, context.session.token)
    }
  }

  async function checkPendingLayoutChange(): Promise<PendingLayoutChange> {
    if (
      !context ||
      !isActiveRequest(selectLayoutChangeRequest(readOperationsState()))
    ) {
      return "none"
    }

    try {
      const cancellable = await canCancelShelfLayoutChangeRequest(
        context.selectedStore.id,
        context.session.token
      )
      return cancellable ? "cancellable" : "locked"
    } catch {
      return "locked"
    }
  }

  async function cancelPendingLayoutChange(): Promise<boolean> {
    const request = selectLayoutChangeRequest(readOperationsState())
    if (!context || !request) {
      return true
    }
    const { session, selectedStore } = context

    const cancelled = await runBusy("cancel-layout-request", async () => {
      const ok = await cancelShelfLayoutChangeRequest(
        request.requestId,
        selectedStore.id,
        session.agentId,
        session.token
      )
      if (!ok) {
        throw new Error(translate("layoutRequestCancelFailed"))
      }
      readOperationsState().forgetRequest(request.requestId)
      await refreshRequests().catch(() => undefined)
      return true
    })
    return cancelled ?? false
  }

  return { cancelPendingLayoutChange, checkLayoutEntry }
}
