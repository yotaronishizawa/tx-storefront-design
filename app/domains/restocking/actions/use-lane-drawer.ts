import { useCallback, useEffect } from "react"

import type { StockDrinkRemoval } from "~/api/opm/schemas"
import {
  readShelfState,
  selectErrorLaneIds,
  useStockBoard,
  useStockDrinkRemoval,
} from "~/domains/shelf"
import { findCell, isLocationBlocked } from "~/model/shelf"

import { readRestockingState } from "../restocking-store"
import {
  useLaneDrawerId,
  useLaneMarks,
  useLaneSwitchPromptOpen,
} from "../use-restocking"

/**
 * The restocking board's lane drawer. A blacklisted lane does not open, and
 * while any lane is red only red lanes do; other taps are silently ignored.
 */
export function useLaneDrawer() {
  const laneDrawerId = useLaneDrawerId()
  const laneMarks = useLaneMarks()
  const switchPromptOpen = useLaneSwitchPromptOpen()
  const board = useStockBoard()
  const { removeDrinks } = useStockDrinkRemoval()

  // The lane is selected only while its drawer is open.
  useEffect(() => {
    if (!laneDrawerId) {
      readShelfState().selectCell(null)
    }
  }, [laneDrawerId])

  const openLane = useCallback(
    (laneId: string) => {
      const location = findCell(board, laneId)?.location
      if (!location || isLocationBlocked(location)) {
        return
      }
      const errorLaneIds = selectErrorLaneIds(readShelfState())
      if (errorLaneIds.length > 0 && !errorLaneIds.includes(laneId)) {
        return
      }
      readShelfState().selectCell({ kind: "stock", id: laneId })
      readRestockingState().setLaneDrawerId(laneId)
    },
    [board]
  )

  /**
   * Finish on the prompt: the marks go and the drawer moves on at once, while
   * the call runs. Once OPM has removed them, the next red lane opens.
   */
  async function finishRemoval(
    locationId: string,
    removals: StockDrinkRemoval[]
  ) {
    const restocking = readRestockingState()
    const target = restocking.laneSwitchTarget ?? ""
    restocking.setLaneDrawerId(target)
    if (await removeDrinks(locationId, removals)) {
      readRestockingState().requestLaneSwitch("")
      readRestockingState().setNextErrorLaneRequested(true)
    } else if (!target && !readRestockingState().laneDrawerId) {
      // A failed Finish reopens the lane; the marks stay gone.
      readShelfState().selectCell({ kind: "stock", id: locationId })
      readRestockingState().setLaneDrawerId(locationId)
    }
  }

  return {
    laneDrawerId,
    laneMarks,
    switchPromptOpen,
    cancelLaneSwitch: readRestockingState().cancelLaneSwitch,
    /** Closes without asking; any marks are dropped. */
    closeLane: () => readRestockingState().setLaneDrawerId(""),
    finishRemoval,
    openLane,
    /** Closes, first asking Finish or Cancel when drinks are marked. */
    requestCloseLane: () => readRestockingState().requestLaneSwitch(""),
    setLaneMarks: readRestockingState().setLaneMarks,
  }
}
