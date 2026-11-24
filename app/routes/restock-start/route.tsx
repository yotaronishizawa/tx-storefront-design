import { useEffect, useRef, useState } from "react"

import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"

import { ROUTES } from "~/config/routes"
import { announceCarryIn, useRestockingActions } from "~/domains/restocking"
import {
  beginRobotStopWatch,
  endRobotStopWatch,
  useRobotWorkStatus,
} from "~/domains/robot"
import { RestockStartView } from "~/views/restocking/restock-start"

/** How long "take the iPad in" stays before the restocking screen opens. */
const CARRY_IN_SECONDS = 6

/**
 * The restock study's start, straight from Home: no rules popup and nothing
 * to tick. Opening it starts restocking, which stops the robot and tilts the
 * shelves; once both are done it asks staff to take the iPad in, then opens
 * the restocking screen by itself. A start that fails goes back to Home.
 */
export default function RestockStartPage() {
  const { t } = useTranslation("app")
  const navigate = useNavigate()
  const { startRestocking } = useRestockingActions()
  const workStatus = useRobotWorkStatus()
  const [started, setStarted] = useState(false)
  const once = useRef(false)

  useEffect(() => {
    if (once.current) return
    once.current = true
    // Watched even with the robot parked: the shared popup then stays shut,
    // as this screen shows the stop, and only a failure still opens it.
    beginRobotStopWatch({ shelves: true, carryIn: true })
    void startRestocking().then((ok) => {
      if (ok) {
        setStarted(true)
        return
      }
      endRobotStopWatch()
      void navigate(ROUTES.home().pathname)
    })
  }, [navigate, startRestocking])

  const robotParked = workStatus === "RestPosition"
  const stopped = started && robotParked
  useEffect(() => {
    if (!stopped) return
    announceCarryIn()
    const timer = window.setTimeout(() => {
      endRobotStopWatch()
      void navigate(ROUTES.restocking().pathname)
    }, CARRY_IN_SECONDS * 1000)
    return () => window.clearTimeout(timer)
  }, [navigate, stopped])

  return (
    <RestockStartView
      carrySeconds={CARRY_IN_SECONDS}
      robotParked={robotParked}
      shelvesSet={started}
      statusLabel={t(
        robotParked ? "robotStatusStoppedTitle" : "robotStatusMovingToRestTitle"
      )}
    />
  )
}
