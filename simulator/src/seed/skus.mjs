import coffee from "./assets/drinks/coffee.jpg?url"
import cola from "./assets/drinks/cola.jpg?url"
import energy from "./assets/drinks/energy.jpg?url"
import grape from "./assets/drinks/grape.jpg?url"
import lemon from "./assets/drinks/lemon.jpg?url"
import milktea from "./assets/drinks/milktea.jpg?url"
import orange from "./assets/drinks/orange.jpg?url"
import sparkling from "./assets/drinks/sparkling.jpg?url"
import sports from "./assets/drinks/sports.jpg?url"
import tea from "./assets/drinks/tea.jpg?url"
import water from "./assets/drinks/water.jpg?url"

const SKU_ROWS = [
  ["SIM-COLA", "コカ・コーラ / Coca-Cola", "4900000000016", "500"],
  ["SIM-WATER", "天然水 2L / Natural Water 2L", "4900000000023", "2000"],
  ["SIM-TEA", "お〜いお茶 / Oi Ocha", "4900000000030", "600"],
  ["SIM-COFFEE", "ボス ブラック / BOSS Black", "4900000000047", "390"],
  ["SIM-SPORTS", "ポカリスエット / Pocari Sweat", "4900000000054", "500"],
  ["SIM-ORANGE", "お〜いお茶 2L / Oi Ocha 2L", "4900000000061", "2000"],
  [
    "SIM-ENERGY",
    "モンスター パイプラインパンチ / Monster Pipeline Punch",
    "4900000000078",
    "355",
  ],
  ["SIM-SPARKLING", "三ツ矢サイダー / Mitsuya Cider", "4900000000085", "500"],
  [
    "SIM-MILKTEA",
    "紅茶花伝 ロイヤルミルクティー / Royal Milk Tea",
    "4900000000092",
    "440",
  ],
  ["SIM-LEMON", "三ツ矢 レモン / Mitsuya Lemon", "4900000000108", "500"],
  // Kept last: the seed leaves it off the display shelf, so it reads as misplaced.
  ["SIM-GRAPE", "ファンタ グレープ / Fanta Grape", "4900000000115", "500"],
]

// Photos of real drinks, for prototypes that should look like a store. The
// names above match them; each id keeps its place in the seed layouts.
const DRINK_PHOTOS = {
  "SIM-COFFEE": coffee,
  "SIM-COLA": cola,
  "SIM-ENERGY": energy,
  "SIM-GRAPE": grape,
  "SIM-LEMON": lemon,
  "SIM-MILKTEA": milktea,
  "SIM-ORANGE": orange,
  "SIM-SPARKLING": sparkling,
  "SIM-SPORTS": sports,
  "SIM-TEA": tea,
  "SIM-WATER": water,
}

const BOTTLE_COLORS = [
  "#c40f1a",
  "#155fb8",
  "#14a44d",
  "#f97316",
  "#8b5cf6",
  "#111827",
  "#38bdf8",
  "#f5c400",
]

export function createSkus() {
  return SKU_ROWS.map(([skuId, itemName, eanCode, volume], index) => ({
    id: skuId,
    itemName,
    itemKeyword: itemName,
    eanCode,
    volume: Number(volume),
    isImageAvailable: true,
    images: [DRINK_PHOTOS[skuId] ?? createBottleSvg(skuId, index)],
  }))
}

function createBottleSvg(skuId, index) {
  const fill = BOTTLE_COLORS[index % BOTTLE_COLORS.length]
  const label = skuId.replace("SIM-", "").slice(0, 3)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="128" viewBox="0 0 64 128"><rect width="64" height="128" fill="white"/><rect x="25" y="8" width="14" height="18" rx="3" fill="${fill}"/><rect x="19" y="24" width="26" height="92" rx="9" fill="${fill}"/><rect x="22" y="52" width="20" height="30" rx="3" fill="white" opacity=".86"/><text x="32" y="72" text-anchor="middle" font-family="Arial" font-size="10" font-weight="700" fill="#111827">${label}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}
