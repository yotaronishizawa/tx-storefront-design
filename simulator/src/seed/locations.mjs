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

/*
 * The restock study's shelves (`study.mjs`): three cabinets, the first with
 * the seed's lanes, filled as real shelves are: gaps, full lanes, mixed
 * lanes, blocked lanes. Rows run top (5) to bottom (1), lanes left to right.
 * `C6` is six colas, `_` an empty lane, `X` a blocked empty lane, `T2+F3` two
 * teas in front of three coffees. Lemon soda is on no lane; coffee is only
 * behind tea, in a mixed lane. Row 1 is tall enough only for 2L bottles,
 * so it holds the 2L water and tea (`W`, `O`) and nothing else, and they
 * stand nowhere higher. A lane holds 8 drinks (the app's
 * STUDY_LANE_CAPACITY), so none starts with more.
 */
const STUDY_SHELVES = [
  {
    cabinet: 1,
    rows: {
      5: "S8 S8 S8 S5 _ K7 K8 K3 _ S8 S6 S2 _ M4 M8",
      4: "T8 T8 T7 _ C8 C6 _ X _ M5 T2+F3 E8 E8 _ K4",
      3: "K6 K2 S8 G1 _ E8 E3 T8 T8 _ T4 C1+S4 _ M8 M2",
      2: "S8 S8 S5 _ E3 E6 K4 K8 _ C6 M8 M7 _ T3 T8",
      1: "W6 W6 W4 _ O5 O3 _ W6 W2 _ O1",
    },
  },
  {
    cabinet: 2,
    rows: {
      5: "K8 K8 K6 _ _ S8 S7 S3 _ E8 E5 _ M8 M8 M3",
      4: "S8 S7 _ C8 C2 _ _ T8 T8 T1 _ K8 K8 K8 _",
      3: "E8 E8 E8 E2 _ K5 _ M2+T3 _ S6 S6 _ E4 _ M6",
      2: "C8 C8 _ T6 T6 _ K8 K8 _ S3 _ K8 K8 _ E2",
      1: "W6 W6 W6 _ O6 O6 _ W5 _ W4 _",
    },
  },
  {
    cabinet: 3,
    rows: {
      5: "M8 M4 _ _ E8 E8 _ C7 C7 _ K3 _ _ S6 S8",
      4: "_ _ T5 T8 _ S8 S8 _ _ M2 _ C1 _ T8 T8",
      3: "E6 E6 _ _ _ _ K7 _ T5 T5 _ K7 _ _ C3",
      2: "T8 _ _ S8 S8 _ M5 _ S8 S8 _ _ E8 _ K2",
      1: "_ O6 O6 _ W5 _ W4 _ _ W6 W3",
    },
  },
]

/*
 * The cabinets stand side by side, cabinet 1 on the left as staff face them.
 * Columns run along x, largest first, so cabinet 1 takes the largest x.
 */
const STUDY_CABINET_X = { 1: 3.2, 2: 1.6, 3: 0 }

/** The study's stock spec: three cabinets, each its own x range. */
export function createStudyStockSpec() {
  const cabinets = STUDY_SHELVES.map(({ cabinet }) => ({
    index: cabinet,
    curtainId: 0,
    minPosX: STUDY_CABINET_X[cabinet],
    maxPosX: STUDY_CABINET_X[cabinet] + 1.6,
  }))
  return { cabinets, shelfCabinets: cabinets.map((item) => ({ ...item })) }
}

const STUDY_SKU_CODES = {
  C: "SIM-COLA",
  E: "SIM-ENERGY",
  F: "SIM-COFFEE",
  G: "SIM-GRAPE",
  K: "SIM-SPARKLING",
  M: "SIM-MILKTEA",
  O: "SIM-ORANGE",
  S: "SIM-SPORTS",
  T: "SIM-TEA",
  W: "SIM-WATER",
}

/*
 * How full the study's display facings are, as a share of a full facing.
 * Below 0.35 is urgent: cola, lemon soda, coffee and tea.
 */
const STUDY_DISPLAY_LEVELS = {
  "SIM-COLA": 0.15,
  "SIM-LEMON": 0.1,
  "SIM-COFFEE": 0.2,
  "SIM-TEA": 0.3,
  "SIM-SPORTS": 0.6,
  "SIM-ORANGE": 0.5,
  "SIM-MILKTEA": 0.7,
}

/** Sets each display facing's `leftCount` (the robot camera's estimate) for the study. */
export function applyStudyDisplayLevels(displayLocations, skus) {
  for (const location of displayLocations) {
    const sku = skus.find((item) => item.id === location.skuId)
    const capacity = sku && sku.volume <= 400 ? 10 : 8
    const level = STUDY_DISPLAY_LEVELS[location.skuId] ?? 0.8
    location.leftCount = Math.round(capacity * level)
  }
}

/** How many more of each drink the study asks for, on top of what is stocked. */
export const STUDY_NEEDED_COUNTS = {
  "SIM-COLA": 21,
  "SIM-LEMON": 12,
  "SIM-COFFEE": 12,
  "SIM-TEA": 6,
  "SIM-SPORTS": 8,
  "SIM-ORANGE": 5,
  "SIM-MILKTEA": 4,
}

function readStudyLane(code) {
  if (code === "_" || code === "X") {
    return []
  }
  return code.split("+").flatMap((part) => {
    const skuId = STUDY_SKU_CODES[part[0]]
    return Array.from({ length: Number(part.slice(1)) }, () => skuId)
  })
}

/** Cabinet 1 keeps the seed's ids, slots and blocked lane, plus `X`; 2 and 3 are added beside it. */
export function createStudyStockLocations() {
  const locations = []
  let hardwareCellIndex = 0
  for (const { cabinet, rows } of STUDY_SHELVES) {
    for (let row = 1; row <= 5; row += 1) {
      const codes = rows[row].split(" ")
      if (codes.length !== (row === 1 ? 11 : 15)) {
        throw new Error(
          `Study shelf ${cabinet} row ${row}: ${codes.length} lanes`
        )
      }
      codes.forEach((code, index) => {
        const column = index + 1
        const skuIds = readStudyLane(code)
        locations.push({
          id: `S${cabinet}-R${row}-L${String(column).padStart(2, "0")}`,
          hardwareCellIndex: hardwareCellIndex++,
          isBlackList:
            code === "X" || (cabinet === 1 && row === 2 && column === 7),
          slot: {
            posX: STUDY_CABINET_X[cabinet] + 1.6 - column * 0.1,
            posY: 0,
            posZ: (row - 1) * 0.12,
          },
          skuId: skuIds[0] ?? "",
          skuIds,
          // Front drink newest; all under the 7-day aged warning, so the
          // study board shows no warnings that are not its point.
          skuEntries: skuIds.map((skuId, drink) => ({
            skuId,
            addedAt: daysAgo(((row + column) % 3) + Math.floor(drink / 4)),
          })),
          errors: [],
        })
      })
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
