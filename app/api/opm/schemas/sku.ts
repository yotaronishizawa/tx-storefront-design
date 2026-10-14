import { z } from "zod"

import { count, list, parse, text } from "../../shared/fields"

// `eanCode` is OPM's only barcode field; its JAN lookups compare against it too.
const skuSchema = z.looseObject({
  id: z.string(),
  eanCode: text,
  images: list(z.string()),
  itemKeyword: text,
  itemName: text,
  volume: count,
  // Height; 0 when unknown.
  z: count,
})

export type Sku = z.output<typeof skuSchema>

export function readSkus(value: unknown): Sku[] {
  return list(skuSchema, "skus").parse(value)
}

/** How many of each SKU the operator should restock, by SKU id. */
export type SkuRecommendationCounts = Record<string, number>

// Strict, unlike the other readers: saving replaces OPM's whole list, so
// misreading it as empty would erase it.
const skuRecommendationsSchema = z.looseObject({
  recommendations: z.record(z.string(), z.number()).nullable(),
})

/**
 * Every listed SKU, a 0 included: saving writes the whole list back, so one
 * left out here would be deleted. A negative count reads as 0. `null` when the
 * answer cannot be read; OPM answers `null`, or a `null` list, for a store that
 * has none yet.
 *
 * @example readSkuRecommendations({ recommendations: { a: 3, b: 0, c: -1 } }) // { a: 3, b: 0, c: 0 }
 * @example readSkuRecommendations({ recommendation: { a: 3 } }) // null
 */
export function readSkuRecommendations(
  value: unknown
): SkuRecommendationCounts | null {
  if (value == null) {
    return {}
  }
  const parsed = parse(skuRecommendationsSchema, value, "SKU recommendations")
  if (!parsed) {
    return null
  }
  return Object.fromEntries(
    Object.entries(parsed.recommendations ?? {}).map(([skuId, count]) => [
      skuId,
      Math.max(0, count),
    ])
  )
}
