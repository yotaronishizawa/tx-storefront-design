const SKU_ROWS = [
  ["SIM-COLA", "コーラ / Cola", "4900000000016", "500"],
  ["SIM-WATER", "天然水 / Mineral Water", "4900000000023", "550"],
  ["SIM-TEA", "緑茶 / Green Tea", "4900000000030", "600"],
  ["SIM-COFFEE", "ブラックコーヒー / Black Coffee", "4900000000047", "390"],
  ["SIM-SPORTS", "スポーツドリンク / Sports Drink", "4900000000054", "500"],
  ["SIM-ORANGE", "オレンジジュース / Orange Juice", "4900000000061", "450"],
  ["SIM-ENERGY", "エナジードリンク / Energy Drink", "4900000000078", "355"],
  ["SIM-SPARKLING", "炭酸水 / Sparkling Water", "4900000000085", "500"],
  ["SIM-MILKTEA", "ミルクティー / Milk Tea", "4900000000092", "440"],
  ["SIM-LEMON", "レモンソーダ / Lemon Soda", "4900000000108", "500"],
  // Kept last: the seed leaves it off the display shelf, so it reads as misplaced.
  ["SIM-GRAPE", "グレープソーダ / Grape Soda", "4900000000115", "500"],
]

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
    images: [createBottleSvg(skuId, index)],
  }))
}

function createBottleSvg(skuId, index) {
  const fill = BOTTLE_COLORS[index % BOTTLE_COLORS.length]
  const label = skuId.replace("SIM-", "").slice(0, 3)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="128" viewBox="0 0 64 128"><rect width="64" height="128" fill="white"/><rect x="25" y="8" width="14" height="18" rx="3" fill="${fill}"/><rect x="19" y="24" width="26" height="92" rx="9" fill="${fill}"/><rect x="22" y="52" width="20" height="30" rx="3" fill="white" opacity=".86"/><text x="32" y="72" text-anchor="middle" font-family="Arial" font-size="10" font-weight="700" fill="#111827">${label}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}
