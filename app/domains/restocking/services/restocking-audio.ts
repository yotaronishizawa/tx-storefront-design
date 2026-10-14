import type { SkuRecommendationCounts } from "~/api/opm/schemas"
import { createLogger } from "~/config/logger"
import {
  findExtraSkuId,
  getLocationLaneErrors,
  getStockLocationSkuIds,
  hasLaneErrors,
  isConstraintError,
  isPlacedWithoutScanningError,
  summarizeLaneUpdate,
  type LaneUpdate,
  type MisplacementCheck,
  type ShelfLocation,
} from "~/model/shelf"
import { AudioCues, playStoreAudioAfterCurrent } from "~/utils/audio"

const logger = createLogger("Restocking Audio")

/**
 * The cue for a lane change, by priority: a newly raised lane error, then a
 * drink placed with nothing scanned, then the drink's count. A drink taken out
 * plays its count too, except one not on display, which its scan already
 * announced. Counts stay silent while any lane has an error.
 */
export function playRestockingPlacementRecommendationAudio({
  currentScannedSkuId,
  isMisplaced,
  nextStockLocations,
  onUnscannedDrink,
  previousStockLocations,
  recommendations,
  updates,
}: {
  currentScannedSkuId: string
  isMisplaced: MisplacementCheck
  nextStockLocations: ShelfLocation[]
  onUnscannedDrink: () => void
  previousStockLocations: ShelfLocation[]
  recommendations: SkuRecommendationCounts
  updates: LaneUpdate[]
}) {
  const errorAudio = getNewLaneErrorAudio(
    previousStockLocations,
    nextStockLocations
  )
  if (errorAudio) {
    void playStoreAudioAfterCurrent(errorAudio)
    return
  }

  const update =
    updates.find((item) => item.laneEventType === "Add") ??
    updates.find((item) => item.laneEventType === "Remove")
  if (!update) {
    return
  }
  const added = update.laneEventType === "Add"

  // OPM names the drink when it has a current SKU; only a nameless add with nothing scanned is unscanned.
  if (added && !currentScannedSkuId && !update.changedSkuId) {
    logger.debug("drink placed with nothing scanned", {
      update: summarizeLaneUpdate(update),
    })
    void playStoreAudioAfterCurrent(AudioCues.NoScannedItem)
    onUnscannedDrink()
    return
  }

  // Errors on blacklisted lanes do not count here.
  if (hasLaneErrors(nextStockLocations)) {
    logger.debug("count skipped: a lane has an error")
    return
  }

  const skuId =
    update.changedSkuId ||
    (added
      ? getAddedSkuIdFromLaneUpdate(update, previousStockLocations)
      : getRemovedSkuIdFromLaneUpdate(update, previousStockLocations)) ||
    currentScannedSkuId
  if (!skuId) {
    logger.debug("recommendation count skipped: SKU not resolved", {
      update: summarizeLaneUpdate(update),
    })
    return
  }

  // Its scan already announced it with a popup; repeating that on every
  // placement only adds noise.
  if (isMisplaced(skuId)) {
    logger.debug("misplaced drink moved; staying silent", { skuId })
    return
  }

  void playRestockingRecommendationCountAudio({
    onAudio: playStoreAudioAfterCurrent,
    phase: "placement",
    recommendations,
    skuId,
    stockLocations: nextStockLocations,
  })
}

/**
 * Says how many more of this drink the shelf still wants. On a scan, at or over
 * target says `0`; on a placement, over target says `-1`.
 */
export async function playRestockingRecommendationCountAudio({
  onAudio,
  phase,
  recommendations,
  skuId,
  stockLocations,
}: {
  onAudio: (key: string) => Promise<boolean>
  phase: "scan" | "placement"
  recommendations: SkuRecommendationCounts
  skuId: string
  stockLocations: ShelfLocation[]
}): Promise<boolean> {
  const count = getRecommendationCount(
    phase,
    recommendations[skuId],
    countSku(stockLocations, skuId)
  )
  logger.debug("playing recommendation count", { count, phase, skuId })
  return onAudio(AudioCues.Count(count))
}

/** `-1` when the SKU has no target, or a placement took it over target. */
function getRecommendationCount(
  phase: "scan" | "placement",
  targetCount: number | undefined,
  currentCount: number
): number {
  if (targetCount === undefined || !Number.isFinite(targetCount)) {
    return -1
  }
  if (phase === "placement" && currentCount > targetCount) {
    return -1
  }
  return Math.max(0, targetCount - currentCount)
}

function countSku(stockLocations: ShelfLocation[], skuId: string): number {
  return stockLocations
    .flatMap(getStockLocationSkuIds)
    .filter((id) => id === skuId).length
}

function getNewLaneErrorAudio(
  previousLocations: ShelfLocation[],
  nextLocations: ShelfLocation[]
): string {
  const previousErrorKeys = new Set(
    previousLocations.flatMap((location) =>
      getLocationLaneErrors(location).map((error) =>
        laneErrorKey(location.id, error)
      )
    )
  )

  for (const location of nextLocations) {
    for (const error of getLocationLaneErrors(location)) {
      if (previousErrorKeys.has(laneErrorKey(location.id, error))) {
        continue
      }
      if (isConstraintError(error)) {
        return AudioCues.CannotReplenish
      }
      if (isPlacedWithoutScanningError(error)) {
        return AudioCues.NoScannedItem
      }
    }
  }
  return ""
}

function laneErrorKey(
  locationId: string,
  error: ReturnType<typeof getLocationLaneErrors>[number]
): string {
  return [
    locationId,
    error.laneErrorType,
    error.discrepancyCause,
    ...error.skuErrors,
  ].join("|")
}

function getAddedSkuIdFromLaneUpdate(
  update: LaneUpdate,
  previousStockLocations: ShelfLocation[]
): string {
  const previous = getPreviousLaneSkuIds(update, previousStockLocations)
  return findExtraSkuId(update.skuIds, previous) || (update.skuIds[0] ?? "")
}

function getRemovedSkuIdFromLaneUpdate(
  update: LaneUpdate,
  previousStockLocations: ShelfLocation[]
): string {
  const previous = getPreviousLaneSkuIds(update, previousStockLocations)
  return findExtraSkuId(previous, update.skuIds)
}

function getPreviousLaneSkuIds(
  update: LaneUpdate,
  previousStockLocations: ShelfLocation[]
): string[] {
  const location = previousStockLocations.find(
    (item) =>
      (update.locationId && item.id === update.locationId) ||
      (update.hardwareCellIndex >= 0 &&
        item.hardwareCellIndex === update.hardwareCellIndex)
  )
  return location ? getStockLocationSkuIds(location) : []
}
