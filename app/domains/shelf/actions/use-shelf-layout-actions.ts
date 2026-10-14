import * as opm from "~/api/opm"
import type {
  SkuRecommendationCounts,
  StartShelfLayoutResult,
} from "~/api/opm/schemas"
import { createLogger } from "~/config/logger"
import { readAppShellState } from "~/domains/app-shell"
import {
  getActionPrompt,
  getActionResponseError,
  runBusy,
} from "~/domains/operations"
import { bringRobotToRest, readRobotState } from "~/domains/robot"
import { readSessionState, useSession } from "~/domains/session"
import {
  useSelectedRobotId,
  useSelectedStore,
  useStoreContext,
} from "~/domains/store-selection"
import { translate } from "~/initializer/i18n"
import {
  buildCabinetShelfLocations,
  cloneLocation,
  displayLayoutIdentity,
  getDisplaySkuIds,
  layoutSignature,
  syncRecommendations,
  type LayoutSendOutcome,
  type RecommendationChange,
  type ShelfLocation,
} from "~/model/shelf"
import { OperatorNotice } from "~/utils/error-message"

import {
  applyRegisteredLayout,
  isCurrentLayoutStore,
} from "../services/layout-registration"
import {
  readShelfState,
  selectMisplacedStock,
  selectSkuById,
} from "../shelf-store"
import {
  readPendingLayout,
  storePendingLayout,
  type PendingLayout,
} from "../storage/pending-layout-storage"

type LayoutResult = "applied" | "accepted" | "review" | "failed"
const logger = createLogger("Shelf Layout")
const submissionsInFlight = new Set<string>()

/** Writes are never retried through another API after an uncertain result. */
export function useShelfLayoutActions() {
  const context = useStoreContext()
  const session = useSession()
  const selectedStore = useSelectedStore()
  const selectedRobotId = useSelectedRobotId()

  function isCurrentContext(storeId: string) {
    return (
      isCurrentLayoutStore(storeId) &&
      readSessionState().session?.token === session?.token
    )
  }

  /** Also resets the edits. */
  async function reloadLatestLayout() {
    if (!context) {
      return
    }
    const { session, selectedStore } = context

    const storeId = selectedStore.id
    const [nextDisplayLocations, nextStockLocations] = await Promise.all([
      opm.getRegisteredDisplayShelfLocations(storeId, session.token),
      opm.getStockShelfLocations(storeId, session.token),
    ])
    if (!isCurrentContext(storeId)) return
    const shelf = readShelfState()
    applyRegisteredLayout(storeId, nextDisplayLocations)
    shelf.setStockLocations(nextStockLocations)
    // A send adds a history snapshot; missing it only leaves the list behind.
    await opm
      .getDisplayShelfLocationHistories(storeId, session.token)
      .then((histories) => {
        if (isCurrentContext(storeId))
          readShelfState().setDisplayHistories(histories)
      })
      .catch(() => undefined)
  }

  /** Offline, edits restart from the layout already loaded. */
  async function startEditing(startFrom?: ShelfLocation[]) {
    if (selectedStore && readPendingLayout(selectedStore.id)) {
      showPending(selectedStore.id, readPendingLayout(selectedStore.id))
      return
    }
    const reloaded = await runBusy("refresh", async () => {
      await reloadLatestLayout()
      return true
    })
    const shelf = readShelfState()
    if (startFrom) {
      shelf.setEditedDisplayLocations(startFrom.map(cloneLocation))
    } else if (!reloaded) {
      shelf.setEditedDisplayLocations(shelf.displayLocations.map(cloneLocation))
    }
  }

  /** A failed read counts as current: it is no proof of a change. */
  async function isBaseLayoutCurrent(): Promise<boolean> {
    if (!context) {
      return true
    }
    const { session, selectedStore } = context

    try {
      const current = await opm.getDisplayShelfLocations(
        selectedStore.id,
        session.token
      )
      return (
        layoutSignature(current) ===
        layoutSignature(readShelfState().displayLocations)
      )
    } catch (caught) {
      logger.warn("Could not re-read the layout before sending.", caught)
      return true
    }
  }

  function showPending(storeId: string, pending: PendingLayout | null) {
    if (!isCurrentContext(storeId)) return
    const shelf = readShelfState()
    shelf.setPendingDisplayLayout(pending?.locations ?? null)
    shelf.setPendingDisplayLayoutIssue(pending?.issue ?? "")
    shelf.setPendingDisplayLayoutNeedCapture(pending?.needRobotCapture ?? false)
    if (pending)
      shelf.setEditedDisplayLocations(pending.locations.map(cloneLocation))
  }

  async function sendLayoutChange(
    needRobotCapture: boolean
  ): Promise<LayoutSendOutcome> {
    if (!selectedStore || submissionsInFlight.has(selectedStore.id))
      return { kind: "failed" }
    const storeId = selectedStore.id
    submissionsInFlight.add(storeId)
    try {
      return finishLayoutResult(await sendLayoutChangeOnce(needRobotCapture))
    } finally {
      submissionsInFlight.delete(storeId)
    }
  }

  async function sendLayoutChangeOnce(
    needRobotCapture: boolean
  ): Promise<LayoutResult> {
    if (
      !session ||
      !selectedStore ||
      !isCurrentContext(selectedStore.id) ||
      readShelfState().layoutStoreId !== selectedStore.id
    )
      return "failed"
    const storeId = selectedStore.id
    const previous = readPendingLayout(storeId)
    if (previous) {
      showPending(storeId, previous)
      return previous.issue ? "review" : "accepted"
    }
    const base = readShelfState().displayLocations
    const draft = readShelfState().editedDisplayLocations.map(cloneLocation)
    const payload = buildCabinetShelfLocations(
      draft,
      readShelfState().displaySpec
    )
    const attempt: {
      started: boolean
      response: StartShelfLayoutResult | null
    } = { started: false, response: null }
    const snapshot: PendingLayout = {
      locations: draft,
      issue: "SubmissionOutcomeUnknown",
      requestId: "",
      needRobotCapture,
    }
    // This response can describe a partially applied write. Reconcile it below
    // before deciding the outcome; the generic command runner cannot do that.
    await runBusy("save-layout", async () => {
      const current = await opm.getRegisteredDisplayShelfLocations(
        storeId,
        session.token
      )
      if (displayLayoutIdentity(current) !== displayLayoutIdentity(base))
        throw new OperatorNotice(translate("workflow.layout.staleBase"))
      if (selectedRobotId) {
        const rest = await bringRobotToRest(selectedRobotId, session.token)
        if (rest !== "resting")
          throw new OperatorNotice(translate("workflow.layout.robotNotReady"))
        const robot = await opm.getRobotStatus(selectedRobotId, session.token)
        if (isCurrentContext(storeId)) readRobotState().setRobot(robot)
        if (
          !isCurrentContext(storeId) ||
          readRobotState().robot?.status !== "RestPosition"
        )
          throw new OperatorNotice(translate("workflow.layout.robotNotReady"))
      }
      if (!isCurrentContext(storeId))
        throw new OperatorNotice(translate("workflow.layout.staleBase"))
      // Persist before the write: reauth/reload or loss of its reply must not
      // turn an indeterminate server write into permission to send it again.
      storePendingLayout(storeId, snapshot)
      attempt.started = true
      attempt.response = await opm.startShelfLayoutChangeRequest(
        storeId,
        payload,
        needRobotCapture,
        session.token
      )
      return attempt.response
    })
    if (!attempt.started) return "failed"
    if (attempt.response?.disposition === "rejected") {
      storePendingLayout(storeId, null)
      showPending(storeId, null)
      const failure = getActionResponseError("save-layout", attempt.response)
      if (failure && isCurrentContext(storeId)) {
        await readAppShellState().askOperator({
          ...getActionPrompt("save-layout", failure, 1),
          buttons: "ok",
        })
      }
      return "failed"
    }
    snapshot.issue =
      attempt.response?.disposition === "accepted"
        ? ""
        : String(attempt.response?.error ?? "SubmissionOutcomeUnknown")
    snapshot.requestId = attempt.response?.requestId ?? ""
    storePendingLayout(storeId, snapshot)
    showPending(storeId, snapshot)
    if (isCurrentContext(storeId) && snapshot.issue)
      readAppShellState().setError("")
    try {
      const current = await opm.getRegisteredDisplayShelfLocations(
        storeId,
        session.token
      )
      if (!isCurrentContext(storeId)) return "failed"
      const result = applyRegisteredLayout(storeId, current)
      return isCurrentContext(storeId) ? result : "failed"
    } catch {
      return isCurrentContext(storeId)
        ? snapshot.issue
          ? "review"
          : "accepted"
        : "failed"
    }
  }

  // A list that failed to load must not be saved over.
  async function syncRecommendationList(): Promise<RecommendationChange | null> {
    const shelf = readShelfState()
    if (!context || shelf.recommendationCountsReadFailed) {
      return null
    }

    const change = syncRecommendations(
      getDisplaySkuIds(shelf.displayLocations, selectSkuById(shelf)),
      shelf.recommendationCounts
    )
    if (!change) {
      return null
    }

    try {
      const saved = await opm.setSkuRecommendations(
        context.selectedStore.id,
        change.counts,
        context.session.token
      )
      if (!isCurrentContext(context.selectedStore.id)) return null
      if (saved) {
        readShelfState().setRecommendationCounts(
          change.counts,
          context.selectedStore.id
        )
        return change
      }
    } catch {
      // Reported below.
    }
    readAppShellState().setError(translate("recommendationListSaveFailed"))
    return null
  }

  async function saveRecommendations(
    recommendations: SkuRecommendationCounts
  ): Promise<boolean> {
    if (!session || !selectedStore) {
      return false
    }

    const saved = await runBusy(
      "save-recommendations",
      async () => {
        const shell = readAppShellState()
        const didSave = await opm.setSkuRecommendations(
          selectedStore.id,
          recommendations,
          session.token
        )
        if (!isCurrentContext(selectedStore.id)) return false
        if (!didSave) {
          shell.setError(translate("recommendationListSaveFailed"))
          return false
        }

        readShelfState().setRecommendationCounts(
          recommendations,
          selectedStore.id
        )
        shell.setNotice(translate("recommendationListSaved"))
        return true
      },
      { formatError: () => translate("recommendationListSaveFailed") }
    )
    return saved ?? false
  }

  async function refreshLayoutStatus(): Promise<LayoutSendOutcome> {
    if (!session || !selectedStore || !isCurrentContext(selectedStore.id))
      return { kind: "failed" }
    const storeId = selectedStore.id
    if (!readPendingLayout(storeId)) return finishLayoutResult("applied")
    const result = await runBusy("save-layout", async () => {
      const current = await opm.getRegisteredDisplayShelfLocations(
        storeId,
        session.token
      )
      if (!isCurrentContext(storeId)) return "failed" as const
      const status = applyRegisteredLayout(storeId, current)
      return isCurrentContext(storeId) ? status : ("failed" as const)
    })
    return finishLayoutResult(result ?? "failed")
  }

  /** A delayed registration readback has the same follow-up as an immediate one. */
  async function finishLayoutResult(
    result: LayoutResult
  ): Promise<LayoutSendOutcome> {
    if (!selectedStore || !isCurrentContext(selectedStore.id))
      return { kind: "failed" }
    if (result !== "applied") return { kind: result }
    const recommendationChange = await syncRecommendationList()
    if (!isCurrentContext(selectedStore.id)) return { kind: "failed" }
    return {
      kind: "applied",
      recommendationChange,
      leftoverStock: selectMisplacedStock(readShelfState()).skuIds.size > 0,
    }
  }

  /** Reads the list again after it failed to load; it stays unsaveable until one read succeeds. */
  async function reloadRecommendations(): Promise<void> {
    if (!context) {
      return
    }
    const { session, selectedStore } = context

    await runBusy(
      "load-recommendations",
      async () => {
        const recommendations = await opm.getSkuRecommendations(
          selectedStore.id,
          session.token
        )
        if (!isCurrentContext(selectedStore.id)) return
        if (!recommendations) {
          throw new Error("unreadable SKU recommendations")
        }
        readShelfState().setRecommendationCounts(
          recommendations,
          selectedStore.id
        )
      },
      { formatError: () => translate("recommendationListReloadFailed") }
    )
  }

  return {
    saveRecommendations,
    sendLayoutChange,
    refreshLayoutStatus,
    isBaseLayoutCurrent,
    reloadLatestLayout,
    reloadRecommendations,
    startEditing,
  }
}
