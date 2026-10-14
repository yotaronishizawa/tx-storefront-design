import { daysAgo } from "../utils/time.mjs"

/** Two cabinets × 5 rows × 12 facings, ids `D<cabinet>-R<row>-F<facing>`. */
export function createDisplayLocations(skus) {
  const locations = []
  for (const cabinet of [1, 2]) {
    for (let row = 0; row < 5; row += 1) {
      for (let column = 1; column <= 12; column += 1) {
        const sku = skus[(cabinet * 5 + row * 2 + column) % skus.length]
        locations.push({
          id: `D${cabinet}-R${row + 1}-F${String(column).padStart(2, "0")}`,
          isBlackList: cabinet === 2 && row === 1 && column === 6,
          slot: {
            posX: cabinet === 1 ? 0.3 - column * 0.1 : 1.7 - column * 0.1,
            posY: cabinet * 0.1,
            posZ: row * 0.12,
          },
          skuId: sku.id,
        })
      }
    }
  }
  return locations
}

/** One cabinet: row 1 has 11 lanes, rows 2–5 have 15. Ids `S1-R<row>-L<lane>`. */
export function createStockLocations(skus) {
  const locations = []
  let hardwareCellIndex = 0
  for (let row = 1; row <= 5; row += 1) {
    const laneCount = row === 1 ? 11 : 15
    for (let column = 1; column <= laneCount; column += 1) {
      // SIM-GRAPE (last) appears in one lane only; every other lane cycles the rest.
      const sku =
        row === 3 && column === 4
          ? skus[skus.length - 1]
          : skus[(row * 3 + column) % (skus.length - 1)]
      const count = 1 + ((row + column) % 3)
      const skuIds = Array.from({ length: count }, () => sku.id)
      const id = `S1-R${row}-L${String(column).padStart(2, "0")}`
      locations.push({
        id: id,
        hardwareCellIndex: hardwareCellIndex++,
        isBlackList: row === 2 && column === 7,
        slot: { posX: 1.6 - column * 0.1, posY: 0, posZ: (row - 1) * 0.12 },
        skuId: sku.id,
        skuIds,
        skuEntries: skuIds.map((skuId, index) => ({
          skuId,
          // Front drink newest; every seventh lane's back drink has no date.
          addedAt:
            index === count - 1 && hardwareCellIndex % 7 === 0
              ? null
              : daysAgo(((row * 2 + column) % 10) + index),
        })),
        errors: [],
      })
    }
  }
  return locations
}
