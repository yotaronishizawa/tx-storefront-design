import { useEffect } from "react"

import { isRestockStudy } from "~/config/restock-study"
import type { LayoutCabinet, RestockGuideView } from "~/model/shelf"
import { getStockLocationSkuIds } from "~/model/shelf"

/** One stock lane as the WI 3D simulator draws it. */
export type WiSimLane = {
  laneId: string
  cabinet: number
  row: number
  column: number
  /** Lanes in this row, and rows in this cabinet: to place the lane on the 3D shelf. */
  columns: number
  rows: number
  skuIds: string[]
}

export type WiSimView = {
  guide: RestockGuideView | undefined
  /** The stock lane the guide points at, empty when it points nowhere. */
  targetLaneId: string
  lanes: WiSimLane[]
}

/**
 * The WI 3D simulator (`public/wi-sim/`) opens the restocking screen in a frame
 * and reads `restockSimView` to walk the staff to the lane the guide shows. It
 * only reads; nothing here changes the screen. Study mode only.
 */
export function useWiSimBridge(
  guide: RestockGuideView | undefined,
  board: LayoutCabinet[]
) {
  useEffect(() => {
    if (!isRestockStudy()) {
      return
    }
    const lanes: WiSimLane[] = board.flatMap((cabinet) =>
      cabinet.rows.flatMap((row) =>
        row.cells.flatMap((cell) =>
          cell.location
            ? [
                {
                  laneId: cell.location.id,
                  cabinet: cabinet.cabinet,
                  row: row.row,
                  column: cell.column,
                  columns: row.cells.length,
                  rows: cabinet.rows.length,
                  skuIds: getStockLocationSkuIds(cell.location),
                },
              ]
            : []
        )
      )
    )
    const targetCellId = guide?.target?.cellId
    const targetLaneId =
      board
        .flatMap((cabinet) => cabinet.rows.flatMap((row) => row.cells))
        .find((cell) => cell.id === targetCellId)?.location?.id ?? ""
    const view: WiSimView = { guide, targetLaneId, lanes }
    Object.assign(globalThis, { restockSimView: view })
  }, [board, guide])
}
