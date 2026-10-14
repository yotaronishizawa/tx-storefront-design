import { useEffect, useRef } from "react"

import { useManualReplenishmentRequest } from "~/domains/operations"
import { useErrorLaneIds, useStockBoard } from "~/domains/shelf"
import { isRequestInProgress } from "~/model/request-state"
import { findCell, isLocationBlocked } from "~/model/shelf"

import { readRestockingState, useRestockingStore } from "../restocking-store"
import { openNextErrorLane } from "../services/next-error-lane"
import {
  useIsOtherDialogOpen,
  useLaneErrorPrompt,
  useLaneSwitchPromptOpen,
} from "../use-restocking"

/**
 * Opens the next red lane when one clears, waiting behind any dialog. A drawer
 * the operator closed is not reopened: it covers the header, so they could not
 * End or leave while an error only OPM can clear remains.
 *
 * On the manual page a lane also opens as soon as it turns red, and whenever
 * the task starts; there is no lane-error popup to wait behind.
 */
export function useErrorLaneGuide({
  manual = false,
}: { manual?: boolean } = {}) {
  const errorLaneIds = useErrorLaneIds()
  const board = useStockBoard()
  const laneDrawerId = useRestockingStore((state) => state.laneDrawerId)
  const requested = useRestockingStore((state) => state.nextErrorLaneRequested)
  const otherDialogOpen = useIsOtherDialogOpen()
  const { open: promptOpen } = useLaneErrorPrompt()
  const switchPromptOpen = useLaneSwitchPromptOpen()
  const manualInProgress =
    isRequestInProgress(useManualReplenishmentRequest()) && manual
  const previousErrorLaneIds = useRef(errorLaneIds)
  const waitsForPrompt = promptOpen && !manual

  useEffect(() => {
    const previous = previousErrorLaneIds.current
    previousErrorLaneIds.current = errorLaneIds
    const cleared = previous.some((laneId) => !errorLaneIds.includes(laneId))
    const raised =
      manual && errorLaneIds.some((laneId) => !previous.includes(laneId))
    if ((cleared || raised) && errorLaneIds.length > 0) {
      readRestockingState().setNextErrorLaneRequested(true)
    }
  }, [errorLaneIds, manual])

  useEffect(() => {
    if (manualInProgress) {
      readRestockingState().setNextErrorLaneRequested(true)
    }
  }, [manualInProgress])

  useEffect(() => {
    if (requested && !otherDialogOpen && !waitsForPrompt && !switchPromptOpen) {
      readRestockingState().setNextErrorLaneRequested(false)
      openNextErrorLane()
    }
  }, [otherDialogOpen, requested, switchPromptOpen, waitsForPrompt])

  // A lane blacklisted or removed while its drawer is open closes it, dropping
  // any marks without asking.
  useEffect(() => {
    if (!laneDrawerId) {
      return
    }
    const location = findCell(board, laneDrawerId)?.location
    if (!location || isLocationBlocked(location)) {
      readRestockingState().setLaneDrawerId("")
    }
  }, [board, laneDrawerId])

  // The drawer belongs to this page; leaving it closes the drawer.
  useEffect(
    () => () => {
      readRestockingState().setLaneDrawerId("")
      readRestockingState().setNextErrorLaneRequested(false)
    },
    []
  )
}
