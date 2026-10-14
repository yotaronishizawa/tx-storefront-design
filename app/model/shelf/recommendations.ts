import type { Sku, SkuRecommendationCounts } from "~/api/opm/schemas"
import { isPlaceholderSku } from "~/model/sku"

import type { ShelfLocation } from "./lane-update"
import { getLocationSkuId } from "./location"

/** Default facings assumed for a SKU when the server has no recommendation yet. */
const DEFAULT_RECOMMENDATION_COUNT = 8

/** The most drinks an operator may ask for per SKU; more is almost always a typo. */
export const MAX_RECOMMENDATION_COUNT = 200

/**
 * A recommended count as it may be saved: a whole number from 0 to
 * `MAX_RECOMMENDATION_COUNT`, or the default when it is not a number at all.
 * Only OPM's list holds a 0; the operator cannot type one.
 *
 * @example clampRecommendationCount(500) // 200
 * @example clampRecommendationCount(-3) // 0
 * @example clampRecommendationCount("x") // DEFAULT_RECOMMENDATION_COUNT
 */
export function clampRecommendationCount(value: unknown): number {
  const count = Number(value)
  if (!Number.isFinite(count)) {
    return DEFAULT_RECOMMENDATION_COUNT
  }

  return Math.max(0, Math.min(MAX_RECOMMENDATION_COUNT, Math.trunc(count)))
}

/** Compares two count maps regardless of key order, so "unsaved changes" is exact. */
export function recommendationSignature(
  counts: SkuRecommendationCounts
): string {
  return JSON.stringify(
    Object.entries(counts)
      .filter(([skuId]) => Boolean(skuId))
      .map(([skuId, count]) => [skuId, clampRecommendationCount(count)])
      .sort(([left], [right]) => String(left).localeCompare(String(right)))
  )
}

export type RecommendationChange = {
  added: string[]
  removed: string[]
  counts: SkuRecommendationCounts
}

export function getDisplaySkuIds(
  locations: ShelfLocation[],
  skuById: Map<string, Sku>
): Set<string> {
  const skuIds = new Set<string>()
  for (const location of locations) {
    const skuId = getLocationSkuId(location)
    if (skuId && !isPlaceholderSku(skuId, skuById.get(skuId))) {
      skuIds.add(skuId)
    }
  }
  return skuIds
}

/**
 * SKUs gone from the display are dropped, new ones join at the default count.
 * `null` when nothing changes.
 *
 * @example syncRecommendations(new Set(["a", "c"]), { a: 3, b: 5 }) // { added: ["c"], removed: ["b"], counts: { a: 3, c: 8 } }
 */
export function syncRecommendations(
  displaySkuIds: ReadonlySet<string>,
  counts: SkuRecommendationCounts
): RecommendationChange | null {
  const removed = Object.keys(counts).filter(
    (skuId) => !displaySkuIds.has(skuId)
  )
  const added = [...displaySkuIds].filter((skuId) => !(skuId in counts))
  if (removed.length === 0 && added.length === 0) {
    return null
  }

  const next: SkuRecommendationCounts = {}
  for (const [skuId, count] of Object.entries(counts)) {
    if (displaySkuIds.has(skuId)) {
      next[skuId] = count
    }
  }
  for (const skuId of added) {
    next[skuId] = DEFAULT_RECOMMENDATION_COUNT
  }
  return { added, removed, counts: next }
}
