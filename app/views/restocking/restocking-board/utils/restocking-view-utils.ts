import type { RecommendationRow } from "~/model/shelf"

import type {
  RecommendationSort,
  RecommendationSortKey,
} from "./restocking-view-types"

/** Ties fall back to the SKU id, so the order is stable. */
export function sortRecommendationRows(
  rows: RecommendationRow[],
  { direction, key }: RecommendationSort
): RecommendationRow[] {
  const sign = direction === "ascending" ? 1 : -1
  return [...rows].sort(
    (left, right) =>
      sign * (left[key] - right[key]) || left.skuId.localeCompare(right.skuId)
  )
}

/** Clicking the active column flips its direction; a new column keeps it. */
export function toggleRecommendationSort(
  current: RecommendationSort,
  key: RecommendationSortKey
): RecommendationSort {
  if (current.key !== key) {
    return { direction: current.direction, key }
  }
  const direction =
    current.direction === "ascending" ? "descending" : "ascending"
  return { direction, key }
}
