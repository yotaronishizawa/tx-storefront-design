import { create } from "zustand"

type RobotStopWatch = {
  /** When an action began stopping a moving robot; `null` when not watching. */
  since: number | null
  /** Restocking and manual start also tilt the shelves meanwhile. */
  shelves: boolean
  /** The robot never reached the stop position. */
  failed: boolean
  /** A restock start in the study: once stopped, ask staff to take the iPad in. */
  carryIn: boolean
}

/**
 * Set by an action that stops a moving robot (restocking or manual start,
 * walk-in, layout send), so one popup can show it travelling to the stop
 * position until it parks. Not started when the robot was already parked:
 * then there is nothing to wait for.
 */
const useRobotStopWatchStore = create<RobotStopWatch>(() => ({
  since: null,
  shelves: false,
  failed: false,
  carryIn: false,
}))

export function useRobotStopWatch(): RobotStopWatch {
  return useRobotStopWatchStore()
}

export function beginRobotStopWatch({
  shelves,
  carryIn = false,
}: {
  shelves: boolean
  carryIn?: boolean
}): void {
  useRobotStopWatchStore.setState({
    since: Date.now(),
    shelves,
    failed: false,
    carryIn,
  })
}

export function failRobotStopWatch(): void {
  if (useRobotStopWatchStore.getState().since === null) return
  useRobotStopWatchStore.setState({ failed: true })
}

export function endRobotStopWatch(): void {
  useRobotStopWatchStore.setState({
    since: null,
    shelves: false,
    failed: false,
    carryIn: false,
  })
}
