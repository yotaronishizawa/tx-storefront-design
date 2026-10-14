import { useEffect } from "react"

import { getStockShelfLocations, subscribeToStockSkuChanges } from "~/api/opm"
import { localShelf } from "~/api/stock-shelf"
import { RECEIVE_LANE_CHANGES_BY_SIGNALR } from "~/config/env"
import { createLogger } from "~/config/logger"
import { readOperationsState, selectRestockRequest } from "~/domains/operations"
import { useSession } from "~/domains/session"
import { readShelfState, selectMisplacementCheck } from "~/domains/shelf"
import { useSelectedStore } from "~/domains/store-selection"
import { isActiveRequest, isRequestInProgress } from "~/model/request-state"
import {
  applyLaneUpdatesToLocations,
  buildPolledLaneUpdates,
  countLaneChanges,
  fromOpmLocationState,
  fromOpmStockSkuChange,
  fromStockShelfLaneUpdate,
  getStockShelfLaneUpdateLocationId,
  hasStockShelfLaneChange,
  isRestockingLaneFocusUpdate,
  summarizeLaneUpdate,
  type LaneUpdate,
  type ShelfLocation,
} from "~/model/shelf"

import { readRestockingState, useRestockingStore } from "../restocking-store"
import { handleManualLaneChanges } from "../services/manual-lane-feedback"
import { playRestockingPlacementRecommendationAudio } from "../services/restocking-audio"
import {
  isOnRestockingPage,
  isRestockingActive,
  isRestockInProgress,
} from "../services/restocking-event-context"

const logger = createLogger("Restocking Lane")

/** Only on the restocking page with a restock in progress, as in the store app. */
function playLaneAudio(
  previousStockLocations: ShelfLocation[],
  nextStockLocations: ShelfLocation[],
  updates: LaneUpdate[]
) {
  if (!isOnRestockingPage() || !isRestockInProgress()) {
    return
  }
  playRestockingPlacementRecommendationAudio({
    currentScannedSkuId: readRestockingState().scannedSkuId,
    isMisplaced: selectMisplacementCheck(readShelfState()),
    nextStockLocations,
    onUnscannedDrink: () => {
      readRestockingState().pushScanAlert({ kind: "no-scanned-drink" })
    },
    previousStockLocations,
    recommendations: readShelfState().recommendationCounts,
    updates,
  })
}

/** Only while a restock request is open, so each session's counts start at zero. */
function recordLaneChanges(
  previousStockLocations: ShelfLocation[],
  nextStockLocations: ShelfLocation[]
) {
  const request = selectRestockRequest(readOperationsState())
  if (!request || !isActiveRequest(request)) {
    return
  }
  const changes = countLaneChanges(previousStockLocations, nextStockLocations)
  if (changes.size > 0) {
    readRestockingState().recordLaneChanges(request.requestId, changes)
  }
}

/** A clean add while lanes are still in error shows their popup again. */
function remindOfLaneErrors(updates: LaneUpdate[]) {
  const cleanAdd = updates.some(
    (update) =>
      update.laneEventType === "Add" && update.errorsInfo?.length === 0
  )
  if (
    cleanAdd &&
    isRestockingActive() &&
    isRequestInProgress(selectRestockRequest(readOperationsState()))
  ) {
    readRestockingState().setDismissedLaneErrorKey("")
  }
}

function focusRestockingLaneUpdate(updates: LaneUpdate[], source: string) {
  const update = updates.find(isRestockingLaneFocusUpdate)
  if (!isRestockInProgress() || !update) {
    return
  }
  const { stockLocations } = readShelfState()
  const locationId = getStockShelfLaneUpdateLocationId(update, stockLocations)
  if (!locationId) {
    logger.debug("focus skipped: location not resolved", {
      source,
      update: summarizeLaneUpdate(update),
    })
    return
  }
  readShelfState().jumpToCell({ kind: "stock", id: locationId })
}

/**
 * Audio, "+N added" counts, focus and the lane-error reminder for lanes that
 * moved, or manual replenishment's own feedback. `polled` updates were made
 * up from two OPM reads, not pushed.
 */
function handleLaneChanges(
  previousStockLocations: ShelfLocation[],
  nextStockLocations: ShelfLocation[],
  updates: LaneUpdate[],
  source: string,
  polled = false
) {
  playLaneAudio(previousStockLocations, nextStockLocations, updates)
  recordLaneChanges(previousStockLocations, nextStockLocations)
  focusRestockingLaneUpdate(updates, source)
  remindOfLaneErrors(updates)
  handleManualLaneChanges(
    previousStockLocations,
    nextStockLocations,
    updates,
    polled
  )
}

/**
 * Applies stock-shelf lane changes to the shelf store, from the local shelf
 * hub when it is reachable and OPM otherwise. Mounted app-wide so a session
 * keeps receiving lane events while the operator is on another screen.
 */
export function useStockShelfLaneUpdates() {
  const session = useSession()
  const selectedStore = useSelectedStore()
  const localStockShelfConnected = useRestockingStore(
    (state) => state.localShelfConnected
  )

  useEffect(() => {
    if (!session || !selectedStore) {
      return
    }

    const storeId = selectedStore.id
    const token = session.token
    let cancelled = false
    let unsubscribeOpmStockSkuChanges: (() => Promise<void>) | undefined

    function applyLaneUpdates(
      updates: LaneUpdate[],
      source: string,
      raw?: unknown
    ) {
      if (cancelled || updates.length === 0) {
        return
      }

      logger.debug("updates received", {
        raw,
        source,
        storeId,
        updates: updates.map(summarizeLaneUpdate),
      })
      // Write, then react outside the store updater, so nothing that replays an update replays its audio.
      const previousStockLocations = readShelfState().stockLocations
      readShelfState().setStockLocations(
        applyLaneUpdatesToLocations(previousStockLocations, updates)
      )
      // Read back: the store scopes lane errors to what this store counts.
      const nextStockLocations = readShelfState().stockLocations

      // Every subscribe and reconnect replays the full snapshot; unmoved lanes must not chime or take focus.
      if (hasStockShelfLaneChange(previousStockLocations, nextStockLocations)) {
        handleLaneChanges(
          previousStockLocations,
          nextStockLocations,
          updates,
          source
        )
      }
    }

    function applyPolledStockLocations(
      polledStockLocations: ShelfLocation[],
      source: string
    ) {
      if (cancelled) {
        return
      }

      const previousStockLocations = readShelfState().stockLocations
      // Always write: a lane going blacklisted or gaining a layout error changes
      // nothing the polled updates compare, but the board must still show it.
      readShelfState().setStockLocations(polledStockLocations)
      // Read back: the store scopes lane errors to what this store counts.
      const nextStockLocations = readShelfState().stockLocations
      const updates = buildPolledLaneUpdates(
        previousStockLocations,
        nextStockLocations
      )
      if (updates.length === 0) {
        return
      }

      logger.debug("polled updates received", {
        raw: polledStockLocations,
        source,
        storeId,
        updates: updates.map(summarizeLaneUpdate),
      })
      handleLaneChanges(
        previousStockLocations,
        nextStockLocations,
        updates,
        source,
        true
      )
    }

    async function refreshStockLocationsFromOpm(source: string) {
      try {
        const polled = await getStockShelfLocations(storeId, token)
        applyPolledStockLocations(polled, source)
      } catch (caught) {
        logger.warn("Failed to refresh stock shelf locations from OPM.", caught)
      }
    }

    const useLocalShelf =
      localStockShelfConnected && RECEIVE_LANE_CHANGES_BY_SIGNALR
    logger.debug("subscribing to lane updates", {
      localStockShelfConnected,
      receiveLaneChangesBySignalR: RECEIVE_LANE_CHANGES_BY_SIGNALR,
      source: useLocalShelf ? "local-signalr" : "opm",
      storeId,
    })

    if (useLocalShelf) {
      const unsubscribeLocalLaneUpdate = localShelf.subscribeLaneUpdate(
        (update) =>
          applyLaneUpdates(
            [fromStockShelfLaneUpdate(update)],
            "local-signalr-change",
            update
          )
      )

      void localShelf
        .getLaneSnapshot()
        .then((updates) =>
          applyLaneUpdates(
            updates.map(fromStockShelfLaneUpdate),
            "local-signalr-snapshot",
            updates
          )
        )
        .catch((caught) => {
          logger.warn("Failed to read local stock shelf lane snapshot.", caught)
        })

      return () => {
        cancelled = true
        logger.debug("unsubscribing local lane updates", { storeId })
        unsubscribeLocalLaneUpdate()
      }
    }

    void refreshStockLocationsFromOpm("opm-stock-location-initial-poll")

    void subscribeToStockSkuChanges(storeId, token, {
      onChange: (changes, raw) =>
        applyLaneUpdates(
          changes
            .map(fromOpmStockSkuChange)
            .filter((update) => update !== undefined),
          "opm-stock-sku-change",
          raw
        ),
      onSnapshot: (states, raw) =>
        applyLaneUpdates(
          states.map(fromOpmLocationState),
          "opm-restocking-snapshot",
          raw
        ),
    })
      .then((unsubscribe) => {
        if (cancelled) {
          void unsubscribe()
          return
        }
        logger.debug("OPM stock SKU subscription ready", { storeId })
        unsubscribeOpmStockSkuChanges = unsubscribe
      })
      .catch((caught) => {
        if (!cancelled) {
          logger.warn("OPM stock SKU subscription is unavailable.", caught)
        }
      })

    return () => {
      cancelled = true
      if (unsubscribeOpmStockSkuChanges) {
        logger.debug("unsubscribing OPM stock SKU changes", { storeId })
        void unsubscribeOpmStockSkuChanges()
      }
    }
    // `session?.token`, not `session`: a token refresh hands back a fresh object, and resubscribing replays the snapshot.
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [localStockShelfConnected, selectedStore, session?.token])
}
