import { useEffect } from "react"

import {
  applyAppUpdate,
  useAppUpdateReady,
  useShellIdle,
} from "~/domains/app-shell"
import { useStoreTaskOpen } from "~/domains/operations"
import { useInactiveFor } from "~/hooks/use-inactive-for"

const APPLY_AFTER_INACTIVE_MS = 30 * 60 * 1000

/**
 * Reloads into a waiting build when nobody taps the banner: after 30 minutes
 * without input, and only while no store task is open and nothing is showing
 * or running. Short of that it keeps waiting; the update is never urgent.
 */
export function useAppUpdateAutoApply() {
  const updateReady = useAppUpdateReady()
  const inactive = useInactiveFor(APPLY_AFTER_INACTIVE_MS)
  const shellIdle = useShellIdle()
  const storeTaskOpen = useStoreTaskOpen()

  const canApply = updateReady && inactive && shellIdle && !storeTaskOpen

  useEffect(() => {
    if (canApply) {
      applyAppUpdate("inactive")
    }
  }, [canApply])
}
