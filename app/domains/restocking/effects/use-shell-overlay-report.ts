import { useEffect } from "react"

import { readAppShellState } from "~/domains/app-shell"

import { useRestockingStore } from "../restocking-store"
import { useLaneErrorPrompt } from "../use-restocking"

/**
 * Tells the shell a restocking popup is waiting, so a background prompt
 * (`askOperatorWhenIdle`) queues behind it instead of replacing it.
 */
function useShellOverlay(key: string, showing: boolean) {
  useEffect(() => {
    readAppShellState().setOverlayShowing(key, showing)
  }, [key, showing])

  useEffect(
    () => () => readAppShellState().setOverlayShowing(key, false),
    [key]
  )
}

/** Queued scan alerts. Mounted app-wide, where scans are received. */
export function useScanAlertOverlayReport() {
  const queued = useRestockingStore((state) => state.scanAlerts.length > 0)
  useShellOverlay("scan-alert", queued)
}

/** The lane-error popup, still to be read; mounted with it on the restocking page. */
export function useLaneErrorOverlayReport() {
  const { pending } = useLaneErrorPrompt()
  useShellOverlay("lane-error", pending)
}
