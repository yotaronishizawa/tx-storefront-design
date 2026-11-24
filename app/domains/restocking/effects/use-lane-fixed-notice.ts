import { useEffect, useRef } from "react"

import { isRestockStudy } from "~/config/restock-study"
import { Toast } from "~/core"
import { useRestockRequest } from "~/domains/operations"
import { useErrorLaneIds, useStockBoard } from "~/domains/shelf"
import { translate } from "~/initializer/i18n"
import { isRequestInProgress } from "~/model/request-state"
import {
  findCell,
  findRow,
  getColumnLabel,
  isLocationBlocked,
} from "~/model/shelf"

import { readRestockingState } from "../restocking-store"
import { announceLaneFixed } from "../services/restock-guide-voice"

/**
 * Restock study: a red lane that clears while restocking says so, on every
 * screen, so it never just vanishes: a toast naming the lane, and the voice
 * for staff facing the shelf. A lane closed off instead (blocked) was not put
 * right and says nothing; nor does one the recovery steps weighed, which tell
 * their own outcome.
 */
export function useLaneFixedNotice() {
  const errorLaneIds = useErrorLaneIds()
  const board = useStockBoard()
  const restocking = isRequestInProgress(useRestockRequest())
  const previous = useRef(errorLaneIds)

  useEffect(() => {
    const before = previous.current
    previous.current = errorLaneIds
    if (!isRestockStudy() || !restocking) {
      return
    }
    const { recoveryLaneId } = readRestockingState()
    const fixed = before.filter((laneId) => {
      const location = findCell(board, laneId)?.location
      if (!location || errorLaneIds.includes(laneId)) {
        return false
      }
      return laneId !== recoveryLaneId && !isLocationBlocked(location)
    })
    const laneId = fixed[fixed.length - 1]
    const cell = findCell(board, laneId ?? "")
    const row = findRow(board, laneId ?? "")
    if (!cell || !row) {
      return
    }
    const left = errorLaneIds.length
    Toast.notify.success(
      translate("restockLaneFixedToast", {
        where: translate("workflow.restock.location", {
          cabinet: cell.cabinet,
          row: cell.row,
          lane: getColumnLabel(cell, row, "stock"),
        }),
      }),
      {
        description:
          left > 0
            ? translate("restockErrorsLeft", { count: left })
            : translate("restockLaneFixedAll"),
        key: "lane-fixed",
      }
    )
    announceLaneFixed(left)
  }, [board, errorLaneIds, restocking])
}
