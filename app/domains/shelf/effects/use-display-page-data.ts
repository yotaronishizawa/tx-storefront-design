import { useEffect } from "react"

import { isOpmConnected, onReconnected } from "~/api/opm"
import { readAppShellState } from "~/domains/app-shell"
import { runBusy, withSupportCodes } from "~/domains/operations"
import { useSession } from "~/domains/session"
import {
  useSelectedRobotId,
  useSelectedStore,
  useStoreDataSettled,
} from "~/domains/store-selection"
import { translate } from "~/initializer/i18n"

import {
  reloadDisplayPage,
  syncDisplayManualJobs,
} from "../services/display-page-data"
import { readShelfState } from "../shelf-store"

const MANUAL_JOB_POLL_INTERVAL_MS = 5000

// Support's code for a failed request.
const RELOAD_FAILED_CODE = "S000450"

/**
 * While the display page is open: reloads it once the store has loaded and
 * after a reconnect, offering Retry or Cancel (back home) when that fails, and
 * polls the robot's queue while connected. Leaving drops the queue and any
 * stuck-lane offer, so the next visit starts from a fresh read.
 */
export function useDisplayPageData() {
  const session = useSession()
  const store = useSelectedStore()
  const settled = useStoreDataSettled()
  const robotId = useSelectedRobotId()
  const storeId = store?.id
  const storeType = store?.storeType

  useEffect(() => {
    if (!session || !storeId || !settled) {
      return
    }
    const context = { storeId, storeType, robotId, token: session.token }
    let open = true
    let reloading = false
    let askingRetry = false

    async function reload() {
      if (reloading) {
        return
      }
      reloading = true
      try {
        while (open) {
          const reloaded = await runBusy("refresh", async () => {
            await reloadDisplayPage(context)
            return true
          })
          if (reloaded || !open) {
            return
          }
          const shell = readAppShellState()
          shell.setError("")
          askingRetry = true
          const choice = await shell.askOperator({
            buttons: "retry-cancel",
            home: true,
            message: withSupportCodes(translate("displayReloadFailed"), [
              RELOAD_FAILED_CODE,
            ]),
          })
          askingRetry = false
          if (choice !== "confirm") {
            return
          }
        }
      } finally {
        reloading = false
      }
    }

    void reload()
    const stopReconnectReload = onReconnected(() => {
      // As in the store app, a reconnect answers the open retry prompt itself.
      if (askingRetry) {
        readAppShellState().answerPrompt("confirm")
        return
      }
      void reload()
    })
    const poll = window.setInterval(() => {
      if (isOpmConnected() && !reloading) {
        void syncDisplayManualJobs(context).catch(() => undefined)
      }
    }, MANUAL_JOB_POLL_INTERVAL_MS)

    return () => {
      open = false
      stopReconnectReload()
      window.clearInterval(poll)
      readShelfState().setDisplayManualJobs(null)
      readShelfState().clearStuckLanes()
    }
  }, [robotId, session, settled, storeId, storeType])
}
