import { useEffect, useMemo, useState } from "react"

import { isRestockStudy, STUDY_LANE_CAPACITY } from "~/config/restock-study"
import {
  useDisplayLocations,
  useRecommendationCounts,
  useSkuById,
  useStockBoard,
  useStockLocations,
} from "~/domains/shelf"
import {
  describeGuideLane,
  findGuideTarget,
  getShelfPosition,
  type RestockEntryItemView,
} from "~/model/shelf"

import { readRestockingState } from "../restocking-store"
import { planEntry } from "../services/restock-entry-plan"

/**
 * The restock study's before-entry list, and the lanes it shows kept for the
 * scans that follow. Undefined outside the study.
 */
export function useRestockEntryPlan(): RestockEntryItemView[] | undefined {
  const [study] = useState(isRestockStudy)
  const board = useStockBoard()
  const displayLocations = useDisplayLocations()
  const recommendations = useRecommendationCounts()
  const skuById = useSkuById()
  const stockLocations = useStockLocations()

  const plan = useMemo(
    () =>
      study
        ? planEntry({
            cabinets: board,
            displayLocations,
            recommendations,
            skuById,
            stockLocations,
          })
        : [],
    [board, displayLocations, recommendations, skuById, stockLocations, study]
  )

  useEffect(() => {
    if (study) {
      readRestockingState().setEntryPlans(
        Object.fromEntries(plan.map((item) => [item.skuId, item.laneIds]))
      )
    }
  }, [plan, study])

  return useMemo(() => {
    if (!study) {
      return undefined
    }
    return plan.map((item) => {
      const target = findGuideTarget(board, item.laneIds, STUDY_LANE_CAPACITY)
      return {
        skuId: item.skuId,
        displayRatio: item.displayRatio,
        neededCount: item.neededCount,
        urgent: item.urgent,
        target: target && {
          cellId: target.cell.id,
          landmark: describeGuideLane(board, target.cell, item.skuId),
          row: target.cell.row,
          shelf: getShelfPosition(board, target.cell.cabinet),
        },
      }
    })
  }, [board, plan, study])
}
