import { useEffect, useRef } from "react"

import { useTranslation } from "react-i18next"

import { getRobotStatus } from "~/api/opm"
import { ROBOT_POLL_INTERVAL_MS } from "~/config/env"
import { Toast } from "~/core"
import { readSessionToken, useSession } from "~/domains/session"
import { useSelectedRobotId } from "~/domains/store-selection"

import { readRobotState, useRobotStore } from "../robot-store"

/** One dropped poll is noise on a shop LAN; four in a row is OPM being gone. */
const STALE_AFTER_FAILED_POLLS = 4

const STALE_TOAST_ID = "robot-status-stale"

/** Polls robot status into the robot store. Mounted app-wide: display-lane reservation depends on it. */
export function useRobotStateLoader() {
  const { t } = useTranslation("app")
  const agentId = useSession()?.agentId ?? ""
  const selectedRobotId = useSelectedRobotId()
  const statusStale = useRobotStore((state) => state.statusStale)
  const failedPollsRef = useRef(0)

  useEffect(() => {
    if (!agentId || !selectedRobotId) {
      readRobotState().clearRobot()
      return
    }

    let cancelled = false
    let inFlight = false

    async function refreshRobotState() {
      if (inFlight) {
        return
      }
      inFlight = true
      let robot: Awaited<ReturnType<typeof getRobotStatus>>
      try {
        robot = await getRobotStatus(selectedRobotId, readSessionToken())
      } catch {
        if (!cancelled) {
          recordFailedPoll()
        }
        return
      } finally {
        inFlight = false
      }

      if (cancelled) {
        return
      }
      failedPollsRef.current = 0
      const state = readRobotState()
      state.setStatusStale(false)
      state.setRobot(robot)
    }

    function recordFailedPoll() {
      failedPollsRef.current += 1
      if (failedPollsRef.current >= STALE_AFTER_FAILED_POLLS) {
        readRobotState().setStatusStale(true)
      }
    }

    void refreshRobotState()
    const interval = window.setInterval(() => {
      void refreshRobotState()
    }, ROBOT_POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      failedPollsRef.current = 0
      window.clearInterval(interval)
    }
  }, [agentId, selectedRobotId])

  // A toast, not a modal: the last-known robot is still the best guess.
  useEffect(() => {
    if (!statusStale) {
      Toast.notify.dismiss(STALE_TOAST_ID)
      return
    }

    Toast.notify.warning(t("robotStatusStale"), {
      duration: Infinity,
      key: STALE_TOAST_ID,
    })

    return () => {
      Toast.notify.dismiss(STALE_TOAST_ID)
    }
  }, [statusStale, t])
}
