import { z } from "zod"

const LOG_LEVELS = ["silent", "error", "warn", "info", "debug"] as const

/** The build's configuration contract. A missing required value fails the build by name. */
export const envSchema = z.object({
  VITE_APP_BASE_PATH: z.string().optional(),
  VITE_APP_VERSION: z.string().optional(),
  /** Absent means no local shelf hardware. */
  VITE_LOCAL_STOCK_SHELF_SIGNALR_URL: z.url().optional(),
  VITE_LOG_LEVEL: z.enum(LOG_LEVELS).optional(),
  VITE_OPM_SIGNALR_URL: z.url(),
  /** Absent reads as on, so absence and `"false"` differ. */
  VITE_RECEIVE_LANE_CHANGES_BY_SIGNALR: z.enum(["true", "false"]).optional(),
  /** Milliseconds. Absent means 2000. */
  VITE_ROBOT_POLL_INTERVAL_MS: z.string().regex(/^\d+$/).optional(),
  /** Absent means no error reporting. */
  VITE_SENTRY_DSN: z.url().optional(),
  VITE_VIDEO_TUTORIAL_CONFIG_URL: z.url().optional(),
})

export type Env = z.infer<typeof envSchema>
