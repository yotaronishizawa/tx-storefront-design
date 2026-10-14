import type { LayoutCabinet, LayoutCell, ShelfKind } from "./board"
import { getLocationSkuId, getStockLocationSkuIds } from "./location"

export function getCellSkuId(cell: LayoutCell, kind: ShelfKind): string {
  if (!cell.location) {
    return ""
  }

  return kind === "stock"
    ? (getStockLocationSkuIds(cell.location)[0] ?? "")
    : getLocationSkuId(cell.location)
}

/** Ids of current display cells whose drink differs from the same row and column in an earlier layout. */
export function createDiffCellIds(
  currentCabinet: LayoutCabinet,
  historyCabinet: LayoutCabinet
): Set<string> {
  const historySkuByPosition = new Map<string, string>()
  for (const row of historyCabinet.rows) {
    for (const cell of row.cells) {
      historySkuByPosition.set(
        `${row.row}:${cell.column}`,
        getCellSkuId(cell, "display")
      )
    }
  }

  const changedIds = new Set<string>()
  for (const row of currentCabinet.rows) {
    for (const cell of row.cells) {
      const historySkuId =
        historySkuByPosition.get(`${row.row}:${cell.column}`) ?? ""
      if (getCellSkuId(cell, "display") !== historySkuId) {
        changedIds.add(cell.id)
      }
    }
  }

  return changedIds
}
