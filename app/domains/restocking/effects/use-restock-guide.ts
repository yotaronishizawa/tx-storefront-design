import { useEffect, useMemo, useState } from "react"

import { isRestockStudy, STUDY_LANE_CAPACITY } from "~/config/restock-study"
import {
  useRecommendationCounts,
  useStockBoard,
  useStockLocations,
} from "~/domains/shelf"
import {
  describeGuideLane,
  findCellByLocationId,
  getShelfPosition,
  type RestockGuideView,
} from "~/model/shelf"

import { useRestockingStore } from "../restocking-store"
import {
  countStillNeeded,
  ensureGuidePlan,
  findGuideTargetOn,
} from "../services/restock-guide"
import { primeGuideVoice } from "../services/restock-guide-voice"

/**
 * The restock study's guide for the board: the lane to fill now and the ones
 * after it. Undefined outside the study, or with no drink scanned.
 */
export function useRestockGuide(
  restocking: boolean
): RestockGuideView | undefined {
  const [study] = useState(isRestockStudy)
  const board = useStockBoard()
  // Only a drink scanned on this visit: one restored from an earlier session
  // would send staff to a lane before they have picked up a case.
  const scannedSkuId = useRestockingStore((state) =>
    state.scannedThisVisit ? state.scannedSkuId : ""
  )
  const scanKey = useRestockingStore(
    (state) => state.laneAdditions.lastScan?.scannedAt ?? ""
  )
  const guidePlan = useRestockingStore((state) => state.guidePlan)
  const recommendations = useRecommendationCounts()
  const stockLocations = useStockLocations()

  useEffect(() => (study ? primeGuideVoice() : undefined), [study])

  // A new drink, or every planned lane full, plans again.
  useEffect(() => {
    if (study && restocking && scannedSkuId) {
      ensureGuidePlan()
    }
  }, [board, restocking, scannedSkuId, study])

  return useMemo(() => {
    if (!study || !restocking || !scannedSkuId) {
      return undefined
    }
    const listed = recommendations[scannedSkuId]
    const done =
      scannedSkuId in recommendations &&
      countStillNeeded(scannedSkuId, recommendations, stockLocations) === 0
    const laneIds = guidePlan.skuId === scannedSkuId ? guidePlan.laneIds : []
    const target = findGuideTargetOn(board, laneIds)
    if (!target) {
      return { skuId: scannedSkuId, scanKey, done, nextCellIds: [] }
    }
    const targetIndex = laneIds.indexOf(target.cell.location?.id ?? "")
    return {
      skuId: scannedSkuId,
      scanKey,
      done,
      target: {
        cabinet: target.cell.cabinet,
        cellId: target.cell.id,
        landmark: describeGuideLane(board, target.cell, scannedSkuId),
        remaining:
          listed !== undefined
            ? {
                count: countStillNeeded(
                  scannedSkuId,
                  recommendations,
                  stockLocations
                ),
                total: listed,
              }
            : { count: target.room, total: STUDY_LANE_CAPACITY },
        room: target.room,
        row: target.cell.row,
        shelf: getShelfPosition(board, target.cell.cabinet),
      },
      nextCellIds: laneIds
        .slice(targetIndex + 1)
        .flatMap((laneId) => findCellByLocationId(board, laneId)?.id ?? []),
    }
  }, [
    board,
    guidePlan,
    recommendations,
    restocking,
    scanKey,
    scannedSkuId,
    stockLocations,
    study,
  ])
}
