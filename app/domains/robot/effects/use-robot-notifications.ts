import { useEffect, useRef } from "react"

import { getStoreNotifications } from "~/api/opm"
import type { StoreNotification } from "~/api/opm/schemas"
import { useSession } from "~/domains/session"
import {
  useSelectedRobotId,
  useSelectedStoreId,
} from "~/domains/store-selection"

import { showRobotNotification } from "../services/robot-notification"

const NOTIFICATION_POLL_INTERVAL_MS = 10_000

/**
 * Shows the operations centre's unchecked notifications one at a time, oldest
 * first, each once per store visit. Mounted app-wide.
 */
export function useRobotNotifications() {
  const session = useSession()
  const storeId = useSelectedStoreId()
  const robotId = useSelectedRobotId()
  // Outlives a token refresh, which restarts the poll mid-notification.
  const shownRef = useRef({ storeId: "", latest: 0, showing: false })

  useEffect(() => {
    if (!session || !storeId) {
      return
    }

    let cancelled = false
    const shown = shownRef.current
    if (shown.storeId !== storeId) {
      // Only notifications newer than the last one shown are queued.
      Object.assign(shown, { storeId, latest: 0 })
    }
    const queue = new Map<string, StoreNotification>()
    const token = session.token

    async function poll() {
      let notifications: StoreNotification[]
      try {
        notifications = await getStoreNotifications(storeId, token)
      } catch {
        return
      }
      for (const notification of notifications) {
        if (
          !notification.isChecked &&
          notification.timestamp > shown.latest &&
          !queue.has(notification.id)
        ) {
          queue.set(notification.id, notification)
        }
      }
      void showNext()
    }

    async function showNext() {
      const next = [...queue.values()].sort(
        (a, b) => a.timestamp - b.timestamp
      )[0]
      if (cancelled || shown.showing || !next) {
        return
      }
      shown.showing = true
      queue.delete(next.id)
      shown.latest = next.timestamp
      await showRobotNotification({
        notification: next,
        storeId,
        robotId,
        token,
      })
      shown.showing = false
      void showNext()
    }

    void poll()
    const interval = window.setInterval(() => {
      void poll()
    }, NOTIFICATION_POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [robotId, session, storeId])
}
