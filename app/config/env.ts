// Every `import.meta.env.VITE_*` read. No fallbacks: an absent optional value means something.

/** Only the literal `"false"` turns a flag off; unset reads as on. */
function booleanFlag(value: string | undefined): boolean {
  return value !== "false"
}

export const OPM_SIGNALR_URL = import.meta.env.VITE_OPM_SIGNALR_URL

export const LOCAL_STOCK_SHELF_SIGNALR_URL = import.meta.env
  .VITE_LOCAL_STOCK_SHELF_SIGNALR_URL

export const RECEIVE_LANE_CHANGES_BY_SIGNALR = booleanFlag(
  import.meta.env.VITE_RECEIVE_LANE_CHANGES_BY_SIGNALR
)

export const ROBOT_POLL_INTERVAL_MS = Number(
  import.meta.env.VITE_ROBOT_POLL_INTERVAL_MS ?? 2000
)

export const VIDEO_TUTORIAL_CONFIG_URL = import.meta.env
  .VITE_VIDEO_TUTORIAL_CONFIG_URL

export const LOG_LEVEL = import.meta.env.VITE_LOG_LEVEL

export const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN

export const APP_VERSION = import.meta.env.VITE_APP_VERSION?.trim() || "dev"
