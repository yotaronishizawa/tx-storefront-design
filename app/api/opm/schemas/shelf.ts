import { z } from "zod"

import { StockHiccupType, UnusedType } from "../__generated__/opm-rpc"
import { count, flag, list, maybe, parse, rawEnum } from "../../shared/fields"

const optionalNumber = maybe(z.number())

/** One drink in a stock lane, aligned by index with `skuIds`. `addedAt` absent = unknown. */
export const skuEntrySchema = z.looseObject({
  skuId: z.string(),
  addedAt: maybe(z.string()),
})

export type SkuEntry = z.output<typeof skuEntrySchema>

/*
 * A layout save sends each location back to OPM whole, so unknown fields pass
 * through and absent ones stay absent rather than becoming a `null` C# rejects.
 */
const shelfLocationSchema = z.looseObject({
  id: z.string(),
  skuId: maybe(z.string()),
  skuIds: maybe(z.array(z.string())),
  skuEntries: maybe(z.array(skuEntrySchema)),
  slot: maybe(
    z.looseObject({
      posX: optionalNumber,
      posY: optionalNumber,
      posZ: optionalNumber,
      x: optionalNumber,
      z: optionalNumber,
    })
  ),
  isBlackList: maybe(z.boolean()),
  // Stock lanes: OPM turns a lane off when the robot cannot pick from it, and
  // `hiccup` says why. The hiccup stays after the lane is turned back on.
  isAvailable: maybe(z.boolean()),
  hiccup: rawEnum(StockHiccupType),
  unusedType: rawEnum(UnusedType),
  // Decoded by `readOpmLocationErrors`.
  errors: maybe(z.array(z.unknown())),
})

/** A display or stock lane, as OPM sends it. */
export type OpmShelfLocation = z.output<typeof shelfLocationSchema>

export function readShelfLocations(value: unknown): OpmShelfLocation[] {
  return list(shelfLocationSchema, "shelf locations").parse(value)
}

/** Required for write preconditions and registration checks; no discarded rows. */
export function readShelfLocationsStrict(value: unknown): OpmShelfLocation[] {
  const number = z
    .number()
    .nullish()
    .transform((value) => value ?? undefined)
  return z
    .array(
      shelfLocationSchema.extend({
        id: z.string().min(1),
        skuId: z
          .string()
          .nullish()
          .transform((value) => value ?? undefined),
        skuIds: z
          .array(z.string())
          .nullish()
          .transform((value) => value ?? undefined),
        isBlackList: z
          .boolean()
          .nullish()
          .transform((value) => value ?? undefined),
        slot: z
          .looseObject({
            posX: number,
            posY: number,
            posZ: number,
            x: number,
            z: number,
          })
          .nullish()
          .transform((value) => value ?? undefined),
        errors: z
          .array(z.unknown())
          .nullish()
          .transform((value) => value ?? undefined),
      })
    )
    .parse(value)
}

const cabinetSchema = z.looseObject({
  index: z.number(),
  curtainId: optionalNumber,
  minPosX: optionalNumber,
  maxPosX: optionalNumber,
  origin: maybe(z.looseObject({ y: optionalNumber })),
})

type ShelfCabinet = z.output<typeof cabinetSchema>

// OPM splits each cabinet across `cabinets` (curtain) and `shelfCabinets` (geometry); merged by `index`.
const shelfSpecSchema = z
  .looseObject({
    cabinets: list(cabinetSchema, "cabinets"),
    shelfCabinets: list(cabinetSchema, "shelf cabinets"),
  })
  .transform(({ cabinets, shelfCabinets }) => ({
    cabinets: mergeCabinetsByIndex([...cabinets, ...shelfCabinets]),
  }))

export type ShelfSpec = z.output<typeof shelfSpecSchema>

function mergeCabinetsByIndex(cabinets: ShelfCabinet[]): ShelfCabinet[] {
  const byIndex = new Map<number, ShelfCabinet>()
  for (const cabinet of cabinets) {
    // The lists never disagree; each leaves out what the other one has.
    const seen = byIndex.get(cabinet.index)
    byIndex.set(cabinet.index, {
      index: cabinet.index,
      curtainId: seen?.curtainId ?? cabinet.curtainId,
      minPosX: seen?.minPosX ?? cabinet.minPosX,
      maxPosX: seen?.maxPosX ?? cabinet.maxPosX,
      origin: seen?.origin ?? cabinet.origin,
    })
  }
  return [...byIndex.values()].sort((left, right) => left.index - right.index)
}

export function readShelfSpec(value: unknown): ShelfSpec | null {
  return parse(shelfSpecSchema, value, "shelf spec")
}

// The robot rests at the store's x = 0 end, or the far end when mirrored.
const storeSpecSchema = z.looseObject({
  deploymentParamInfo: maybe(
    z.looseObject({
      motionInfo: maybe(
        z.looseObject({
          storeInfo: maybe(z.looseObject({ mirrored: flag })),
        })
      ),
    })
  ),
})

/**
 * @example readStoreMirrored({ deploymentParamInfo: { motionInfo: { storeInfo: { mirrored: true } } } }) // true
 * @example readStoreMirrored(null) // false
 */
export function readStoreMirrored(value: unknown): boolean {
  const spec = parse(storeSpecSchema, value ?? {}, "store spec")
  return spec?.deploymentParamInfo?.motionInfo?.storeInfo?.mirrored ?? false
}

const shelfLocationHistorySchema = z.looseObject({
  bkTimestamp: count,
  histories: list(shelfLocationSchema, "shelf location history"),
})

/** A past layout, with OPM's `bkTimestamp` (Unix seconds) as epoch milliseconds. */
export type ShelfLocationHistory = {
  locations: OpmShelfLocation[]
  timestamp: number
}

export function readShelfLocationHistory(
  value: unknown
): ShelfLocationHistory | null {
  const history = parse(
    shelfLocationHistorySchema,
    value,
    "shelf location history"
  )
  if (!history || history.histories.length === 0) {
    return null
  }
  return { locations: history.histories, timestamp: history.bkTimestamp * 1000 }
}
