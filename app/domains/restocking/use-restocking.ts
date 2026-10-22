import { useEffect, useMemo } from "react"

import {
  useActionPrompt,
  useActiveDialog,
  useShellMessage,
} from "~/domains/app-shell"
import { useRestockRequest } from "~/domains/operations"
import { useLaneErrorBlock, useStockLocations } from "~/domains/shelf"
import { isActiveRequest } from "~/model/request-state"
import {
  scannerBatteryFrom,
  type ScannerBattery,
} from "~/model/scanner-battery"
import type { ScannerConnectionSource } from "~/model/scanner-scan"
import {
  getLaneErrorPrompt,
  type LaneErrorPrompt,
  type LaneMarks,
} from "~/model/shelf"

import {
  NO_LANE_ADDITIONS,
  readRestockingState,
  selectRestockingPlacement,
  selectScannerConnected,
  selectScannerConnectionSource,
  useRestockingStore,
  type LaneAdditions,
  type PulledLane,
  type RestockingPlacement,
  type ScanAlert,
} from "./restocking-store"

/** The lane a drink was last pulled from in manual replenishment, to flash. */
export function usePulledLane(): PulledLane {
  return useRestockingStore((state) => state.pulledLane)
}

export function useRestockingPlacement(): RestockingPlacement {
  return useRestockingStore(selectRestockingPlacement)
}

/** The open restock's id, or "" — open includes paused. */
export function useActiveRestockRequestId(): string {
  const restockRequest = useRestockRequest()
  return restockRequest && isActiveRequest(restockRequest)
    ? restockRequest.requestId
    : ""
}

export function useRestockingLaneAdditions(): LaneAdditions {
  const activeRequestId = useActiveRestockRequestId()
  const laneAdditions = useRestockingStore((state) => state.laneAdditions)

  useEffect(() => {
    readRestockingState().hydrateLaneAdditions(activeRequestId)
  }, [activeRequestId])

  if (!activeRequestId || laneAdditions.requestId !== activeRequestId) {
    return NO_LANE_ADDITIONS
  }
  return laneAdditions
}

export function useCurrentScanAlert(): ScanAlert | undefined {
  return useRestockingStore((state) => state.scanAlerts[0])
}

export function useScannerConnected(): boolean {
  return useRestockingStore(selectScannerConnected)
}

/** `undefined` while the scanner sends no battery value at all. */
export function useScannerBattery(): ScannerBattery | undefined {
  return scannerBatteryFrom(
    useRestockingStore((state) => state.scannerBatteryLevel)
  )
}

export function useScannerConnectionSource(): ScannerConnectionSource {
  return useRestockingStore(selectScannerConnectionSource)
}

/** False until OPM first answers for this store or session. */
export function useSmartShelvesStatusKnown(): boolean {
  return useRestockingStore((state) => state.smartShelvesStatusKnown)
}

export function useShelvesFlat(): boolean {
  return useRestockingStore((state) => state.shelvesFlat)
}

export function useLaneDrawerId(): string {
  return useRestockingStore((state) => state.laneDrawerId)
}

export function useLaneMarks(): LaneMarks {
  return useRestockingStore((state) => state.laneMarks)
}

/** The drawer's Finish/Cancel prompt is up, waiting on the operator. */
export function useLaneSwitchPromptOpen(): boolean {
  return useRestockingStore((state) => state.laneSwitchTarget !== null)
}

/**
 * The popup a blocking lane error raises, and whether it is showing: not once
 * the operator has dismissed this set of lanes, and never over another dialog.
 */
export function useLaneErrorPrompt(): {
  open: boolean
  /** Waiting to be read, even while another dialog keeps it closed. */
  pending: boolean
  prompt: LaneErrorPrompt | null
} {
  const block = useLaneErrorBlock()
  const stockLocations = useStockLocations()
  const prompt = useMemo(
    () => getLaneErrorPrompt(block, stockLocations),
    [block, stockLocations]
  )
  const dismissedKey = useRestockingStore(
    (state) => state.dismissedLaneErrorKey
  )
  const otherDialogOpen = useIsOtherDialogOpen()
  const dismissed = prompt?.key === dismissedKey
  const pending = prompt !== null && !dismissed

  return { open: pending && !otherDialogOpen, pending, prompt }
}

/** Any dialog the lane-error popup and the error-lane guide must wait behind. */
export function useIsOtherDialogOpen(): boolean {
  const message = useShellMessage()
  const activeDialog = useActiveDialog()
  const actionPrompt = useActionPrompt()
  const scanAlert = useCurrentScanAlert()
  return Boolean(message || activeDialog || actionPrompt || scanAlert)
}
