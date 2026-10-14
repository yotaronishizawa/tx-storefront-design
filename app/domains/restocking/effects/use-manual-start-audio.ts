import { useEffect, useRef } from "react"

import { useManualReplenishmentRequest } from "~/domains/operations"
import { isRequestInProgress } from "~/model/request-state"
import { AudioCues, playStoreAudio } from "~/utils/audio"

/**
 * Plays the start voice (the aged-stock one when old stock is on the shelf)
 * whenever the task turns in progress, including on entering the page with
 * one already running.
 */
export function useManualStartAudio(hasAgedStock: boolean) {
  const inProgress = isRequestInProgress(useManualReplenishmentRequest())
  const hasAgedStockRef = useRef(hasAgedStock)

  useEffect(() => {
    hasAgedStockRef.current = hasAgedStock
  }, [hasAgedStock])

  useEffect(() => {
    if (inProgress) {
      void playStoreAudio(
        hasAgedStockRef.current
          ? AudioCues.CanStartManualReplenishmentAgedStock
          : AudioCues.CanStartManualReplenishment
      )
    }
  }, [inProgress])
}
