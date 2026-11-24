import * as opm from "~/api/opm"
import { type RequestContext } from "~/api/opm/schemas"
import { readAppShellState } from "~/domains/app-shell"
import {
  ActionFailureNotice,
  findRestartBlocker,
  getActionResponseError,
  readOperationsState,
  useStoreActionRunner,
} from "~/domains/operations"
import { readRobotState } from "~/domains/robot"
import { readSessionState, useSession } from "~/domains/session"
import { readShelfState } from "~/domains/shelf"
import {
  readStoreSelectionState,
  useSelectedRobotId,
  useSelectedStore,
} from "~/domains/store-selection"
import { translate } from "~/initializer/i18n"
import type { RobotDetector } from "~/model/robot-attention"
import { blocksRestockingStartOrEnd, getLaneErrorBlock } from "~/model/shelf"
import {
  getEndableWorkflowRequest,
  getWorkflowStartDecision,
  type WorkflowMode,
} from "~/model/workflow-state"
import type { StoreAction } from "~/types/busy-action"
import { OperatorNotice } from "~/utils/error-message"

import { readRestockingState } from "../restocking-store"
import { pauseRestocking, pauseSettled } from "../services/pause-restocking"
import { refuseRestockingStart } from "../services/restocking-start-checks"

// Spans every step in a transition; a second click must not slip between End and Start.
let workflowInFlight = false

/** Explicit user actions only. Navigation and reload never start/end a session. */
export function useRestockingActions() {
  const runAction = useStoreActionRunner()
  const session = useSession()
  const store = useSelectedStore()
  const robotId = useSelectedRobotId()

  function assertCurrentStore() {
    if (
      !store ||
      readStoreSelectionState().selectedStoreId !== store.id ||
      readSessionState().session?.token !== session?.token
    ) {
      throw new OperatorNotice(translate("workflow.stateChanged"))
    }
  }

  async function readRequests() {
    if (!session || !store)
      throw new OperatorNotice(translate("workflow.resultUnknown"))
    let requests: RequestContext[]
    try {
      requests = await opm.getWorkflowRequests(store.id, session.token)
    } catch {
      throw new OperatorNotice(translate("workflow.resultUnknown"))
    }
    assertCurrentStore()
    if (requests.some((request) => request.storeId !== store.id))
      throw new OperatorNotice(translate("workflow.resultUnknown"))
    readOperationsState().setRequests(requests)
    return requests
  }

  async function assertFreshLaneErrorsAllowRestocking() {
    if (!session || !store)
      throw new OperatorNotice(translate("workflow.resultUnknown"))
    const locations = await opm
      .getWorkflowStockLocations(store.id, session.token)
      .catch(() => {
        throw new OperatorNotice(translate("workflow.resultUnknown"))
      })
    assertCurrentStore()
    readShelfState().setStockLocations(locations)
    if (blocksRestockingStartOrEnd(getLaneErrorBlock(locations)))
      throw new OperatorNotice(translate("restockingLaneErrorsBlock"))
  }

  async function readStartDecision(mode: WorkflowMode) {
    const decision = getWorkflowStartDecision(await readRequests(), mode)
    if (decision === "blocked")
      throw new OperatorNotice(translate("workflow.stateChanged"))
    return decision
  }

  async function execute(action: StoreAction, operation: () => Promise<void>) {
    if (
      !session ||
      !store ||
      workflowInFlight ||
      readAppShellState().busyAction
    )
      return false
    workflowInFlight = true
    try {
      return await runAction(
        action,
        async () => {
          await operation()
          return { error: 0, startRobotOperationError: 0 }
        },
        // The readback has updated the work screen; another OK would block it.
        { replay: false, successNotice: false }
      )
    } finally {
      workflowInFlight = false
    }
  }

  async function start(mode: WorkflowMode, resumeExisting = false) {
    if (!session || !store) return
    // A queued leave-pause must settle before its same task can be resumed.
    if (mode === "Restock") await pauseSettled()
    assertCurrentStore()
    const action = mode === "Restock" ? "start-restocking" : "start-manual"
    if ((await readStartDecision(mode)) === "existing" && !resumeExisting)
      return
    if (mode === "Restock") await assertFreshLaneErrorsAllowRestocking()
    if (mode === "Restock" && refuseRestockingStart())
      throw new OperatorNotice(readAppShellState().error)
    assertCurrentStore()
    if (mode === "Restock") readRestockingState().invalidateScan()
    let result: unknown
    try {
      result =
        mode === "Restock"
          ? await opm.startRestocking(store.id, session.token)
          : // Curtains are part of this track by design: OPM opens them here
            // (and closes them on EndManualReplenishment) in curtain stores,
            // so staff never operate them on their own. Keep it that way.
            await opm.startManualReplenishment(store.id, session.token)
    } catch {
      await readRequests()
      throw new OperatorNotice(translate("workflow.resultUnknown"))
    }
    const responseError = getActionResponseError(action, result, {
      allowAlreadyDone: false,
    })
    const current = await readRequests()
    if (responseError) throw new ActionFailureNotice(action, responseError)
    if (getWorkflowStartDecision(current, mode) !== "existing")
      throw new OperatorNotice(translate("workflow.resultUnknown"))
  }

  async function end(mode: WorkflowMode, restart: boolean) {
    if (!session || !store) return
    const action = mode === "Restock" ? "end-restocking" : "end-manual"
    if (mode === "Restock") await assertFreshLaneErrorsAllowRestocking()
    const current = getEndableWorkflowRequest(await readRequests(), mode)
    if (!current) throw new OperatorNotice(translate("workflow.stateChanged"))
    if (mode === "ManualReplenishment")
      readRestockingState().setEndingManualRequestId(current.requestId)
    let result: unknown
    let commandFailed = false
    try {
      result =
        mode === "Restock"
          ? await opm.endRestocking(
              store.id,
              current.requestId,
              session.token,
              restart
            )
          : await opm.endManualReplenishment(
              store.id,
              current.requestId,
              session.token,
              restart
            )
    } catch {
      // Do not resend a timed-out command. It may already have closed the task.
      commandFailed = true
    }
    // Do not show the pre-command parked state while the robot may now be capturing.
    assertCurrentStore()
    if (robotId) {
      readRobotState().setRobot(null)
      const robot = await opm
        .getRobotStatus(robotId, session.token)
        .catch(() => null)
      assertCurrentStore()
      readRobotState().setRobot(robot)
    }
    let confirmed: RequestContext
    try {
      confirmed = await opm.getWorkflowRequest(current.requestId, session.token)
      await readRequests()
    } catch {
      throw new OperatorNotice(translate("workflow.resultUnknown"))
    }
    assertCurrentStore()
    if (
      confirmed.requestId !== current.requestId ||
      confirmed.requestType !== mode ||
      confirmed.storeId !== store.id
    ) {
      throw new OperatorNotice(translate("workflow.resultUnknown"))
    }
    const closed = confirmed.status === "Closed"
    if (mode === "ManualReplenishment" && !closed)
      readRestockingState().setEndingManualRequestId("")
    const responseError = getActionResponseError(action, result, {
      allowAlreadyDone: false,
    })
    if (commandFailed || responseError) {
      if (!commandFailed && responseError)
        throw new ActionFailureNotice(
          action,
          responseError,
          closed ? translate("workflow.sessionEndedNextNotStarted") : ""
        )
      const detail = translate("workflow.resultUnknown")
      throw new OperatorNotice(
        closed
          ? `${translate("workflow.sessionEndedNextNotStarted")} ${detail}`
          : detail
      )
    }
    if (!closed) throw new OperatorNotice(translate("workflow.resultUnknown"))
  }

  async function startRestocking() {
    if (
      !session ||
      !store ||
      workflowInFlight ||
      readAppShellState().busyAction
    )
      return false
    if (refuseRestockingStart()) {
      readAppShellState().closeDialog("restocking-start")
      void pauseRestocking()
      return false
    }
    const ok = await execute("start-restocking", () => start("Restock", true))
    if (ok) {
      readAppShellState().closeDialog("restocking-start")
      // Just started: the restocking screen must not run the start again on entry.
      markRestockJustStarted()
    } else void pauseRestocking()
    return ok
  }

  function cancelRestockingStart() {
    readAppShellState().closeDialog("restocking-start")
    void pauseRestocking()
  }

  async function startManualReplenishment() {
    const ok = await execute("start-manual", () => start("ManualReplenishment"))
    if (ok) readAppShellState().closeDialog("manual-start")
    return ok
  }

  async function endRestocking() {
    // Something already seen by a detector would only stop the restart:
    // end the task without restarting, and Home shows why straight away.
    const blocker = await findRestartBlocker()
    const ok = await execute("end-restocking", () => end("Restock", !blocker))
    if (ok) {
      readAppShellState().closeDialog("restocking-end")
      noteRestart(blocker)
    }
    return ok
  }

  async function endManualReplenishment(startRobotOperationAfter = true) {
    const blocker = startRobotOperationAfter ? await findRestartBlocker() : null
    const ok = await execute("end-manual", () =>
      end("ManualReplenishment", startRobotOperationAfter && !blocker)
    )
    if (ok) {
      readAppShellState().closeDialog("manual-finish")
      if (startRobotOperationAfter) noteRestart(blocker)
    }
    return ok
  }

  async function continueWork(source: WorkflowMode, target: WorkflowMode) {
    const ok = await execute(
      source === "Restock" ? "end-restocking" : "end-manual",
      async () => {
        const requests = await readRequests()
        // Another tab may have completed the same transition. A read is enough.
        if (getWorkflowStartDecision(requests, target) === "existing") return
        await end(source, false)
        try {
          await start(target)
        } catch (caught) {
          if (caught instanceof ActionFailureNotice)
            throw new ActionFailureNotice(
              caught.action,
              caught.failure,
              translate("workflow.sessionEndedNextNotStarted")
            )
          throw new OperatorNotice(
            `${translate("workflow.sessionEndedNextNotStarted")} ${caught instanceof Error ? caught.message : translate("workflow.resultUnknown")}`,
            { cause: caught }
          )
        }
      }
    )
    if (ok && target === "Restock") markRestockJustStarted()
    if (ok)
      readAppShellState().closeDialog(
        source === "Restock" ? "restocking-end" : "manual-finish"
      )
    return ok
  }

  return {
    cancelRestockingStart,
    startRestocking,
    endRestocking,
    startManualReplenishment,
    endManualReplenishment,
    continueToManualReplenishment: () =>
      continueWork("Restock", "ManualReplenishment"),
    continueToRestocking: () => continueWork("ManualReplenishment", "Restock"),
  }
}

/** After ending a task: either a detector held the restart, or OPM restarted the robot. */
function noteRestart(blocker: RobotDetector | null) {
  const operations = readOperationsState()
  if (blocker) operations.setRestartHeldBy(blocker)
  // A failed restart already left its reason; do not clear it.
  else if (!operations.resumeFailure) operations.markRestarted()
}

/**
 * Marks the restock now in progress as started here, so the restocking
 * screen's entry does not ask to resume it (see `useRestockingResumeOnEntry`).
 */
function markRestockJustStarted() {
  const request = readOperationsState().requests.find(
    (item) => item.requestType === "Restock" && item.status === "InProgress"
  )
  readRestockingState().setContinuedRestockingRequestId(request?.requestId ?? "")
}
