import { useEffect } from "react"

import { createLogger } from "~/config/logger"
import { watchServiceWorkerUpdates } from "~/utils/service-worker"

import { readAppShellState } from "../app-shell-store"

const logger = createLogger("App Update")

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000

/** Looks for a new build hourly and on wake, and flags it once it waits to take over. Mounted once. */
export function useAppUpdateWatch() {
  useEffect(
    () =>
      watchServiceWorkerUpdates(() => {
        if (!readAppShellState().updateReady) {
          logger.info("A new build is ready")
          readAppShellState().setUpdateReady(true)
        }
      }, UPDATE_CHECK_INTERVAL_MS),
    []
  )
}
