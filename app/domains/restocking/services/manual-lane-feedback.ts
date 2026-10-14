import { ROUTES } from "~/config/routes"
import {
  readOperationsState,
  selectManualReplenishmentRequest,
} from "~/domains/operations"
import { readShelfState } from "~/domains/shelf"
import { isRequestInProgress } from "~/model/request-state"
import {
  getLaneErrorChange,
  getStockShelfLaneUpdateLocationId,
  type LaneUpdate,
  type ShelfLocation,
} from "~/model/shelf"
import {
  AudioCues,
  playStoreAudioAfterCurrent,
  SoundEffects,
} from "~/utils/audio"
import { isSamePathname } from "~/utils/pathname"

import { readRestockingState } from "../restocking-store"

const LANE_ERROR_CUES = {
  fixed: SoundEffects.ManualDrinkFixed,
  match: AudioCues.ErrorRemovedNotFirstDrink,
  removeDrink: AudioCues.ErrorAddedDrink,
} as const

/** Only on the manual page, with the task in progress. */
function isManualFeedbackActive(): boolean {
  return (
    isSamePathname(
      readRestockingState().currentPathname,
      ROUTES.manual().pathname
    ) &&
    isRequestInProgress(selectManualReplenishmentRequest(readOperationsState()))
  )
}

/**
 * A drink pulled flashes its lane green, shows its cabinet and chimes; a lane
 * error raised or fixed has its own voice, which wins. Pulls come only from
 * pushed events: a 5s poll would chime late, for drinks long gone.
 */
export function handleManualLaneChanges(
  previousStockLocations: ShelfLocation[],
  nextStockLocations: ShelfLocation[],
  updates: LaneUpdate[],
  polled: boolean
) {
  // The first read after a reload holds every error already there; none is new.
  if (!isManualFeedbackActive() || previousStockLocations.length === 0) {
    return
  }

  const pulled = polled
    ? undefined
    : updates.find((update) => update.laneEventType === "Remove")
  const pulledLaneId = pulled
    ? getStockShelfLaneUpdateLocationId(pulled, nextStockLocations)
    : ""
  if (pulledLaneId) {
    readRestockingState().flashPulledLane(pulledLaneId)
    readShelfState().focusCell({ kind: "stock", id: pulledLaneId })
  }

  const errorChange = getLaneErrorChange(
    previousStockLocations,
    nextStockLocations
  )
  const cue = errorChange
    ? LANE_ERROR_CUES[errorChange]
    : pulledLaneId && SoundEffects.RemoveDrinkSuccessfully
  if (cue) {
    void playStoreAudioAfterCurrent(cue)
  }
}
