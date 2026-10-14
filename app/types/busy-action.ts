// UI ids for the work the operator waits on — the app's own names, not OPM method names.

/** A command run through `useStoreActionRunner()`: each one keys a `STORE_ACTIONS` entry (popups, retries, audio). */
export type StoreAction =
  | "start-restocking"
  | "end-restocking"
  | "end-restocking-to-manual"
  | "start-auto-pnp"
  | "stop-auto-pnp"
  | "start-robot-software"
  | "start-manual"
  | "end-manual"
  | "save-layout"
  | "curtains-up"
  | "curtains-down"
  | "rest-position-top"
  | "rest-position-bottom"
  | "remove-drink"
  | "check-lane"

/** Work run through `runBusy()` alone: a spinner and an error banner, no popup or retry. */
export type BusyTask =
  | "refresh"
  | "load-recommendations"
  | "save-recommendations"
  | "robot-to-rest"
  | "robot-start-check"
  | "teleoperation-stop"
  | "cancel-layout-request"
  | "reset-stuck-lanes"
  | `display-manual-job:${string}`

/** What the app-shell spinner is waiting on, so a view can disable the matching button; `""` when idle. */
export type BusyAction = StoreAction | BusyTask | ""
