import { create } from "zustand"

/**
 * An action that stops a running robot (restocking or manual start, layout
 * send) marks when it began, so the app can show the robot travelling to the
 * stop position until it parks. Not started when the robot was already
 * stopped: then there is nothing to wait for.
 */
const useRobotStopWatchStore = create<{ since: number | null }>(() => ({
  since: null,
}))

export function useRobotStopWatch(): number | null {
  return useRobotStopWatchStore((state) => state.since)
}

export function beginRobotStopWatch(): void {
  useRobotStopWatchStore.setState({ since: Date.now() })
}

export function endRobotStopWatch(): void {
  useRobotStopWatchStore.setState({ since: null })
}
