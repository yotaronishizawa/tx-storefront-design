// The app's only sanctioned `console` access. Shipped builds drop anything
// below `warn`, so per-scan restocking payloads do not stream out all shift.
// `warn` and `error` are also reported (Sentry Logs, and an issue for `error`)
// whatever the console level.

import { LOG_LEVEL } from "./env"
import { reportLog } from "./error-reporting"

const LEVELS = ["silent", "error", "warn", "info", "debug"] as const

type Level = Exclude<(typeof LEVELS)[number], "silent">

const activeLevel = LOG_LEVEL ?? (import.meta.env.DEV ? "debug" : "warn")
const activeLevelIndex = LEVELS.indexOf(activeLevel)

function isEnabled(level: Level): boolean {
  return LEVELS.indexOf(level) <= activeLevelIndex
}

/** One `[text]` segment of a tagged line; `style` is CSS for the console's `%c`. */
type LogTag = { style?: string; text: string }

type Logger = {
  debug: (message: string, details?: unknown) => void
  error: (message: string, details?: unknown) => void
  info: (message: string, details?: unknown) => void
  /** Debug-level `[scope] [tag] [tag]` header in colour, with `details` on the line below. */
  tagged: (tags: LogTag[], details?: unknown) => void
  warn: (message: string, details?: unknown) => void
}

const SCOPE_STYLE = "color: #6b7280"

/**
 * @example createLogger("Restocking Lane").debug("updates received", { count: 2 })
 * // logs: [Restocking Lane] updates received { count: 2 }
 */
export function createLogger(scope: string): Logger {
  const prefix = `[${scope}]`

  function write(level: Level, message: string, details?: unknown) {
    const line = `${prefix} ${message}`
    if (level === "warn" || level === "error") {
      reportLog(level, scope, line, details)
    }

    if (!isEnabled(level)) {
      return
    }

    if (details === undefined) {
      console[level](line)
      return
    }

    console[level](line, details)
  }

  function tagged(tags: LogTag[], details?: unknown) {
    if (!isEnabled("debug")) {
      return
    }

    const header = [`%c${prefix}`, ...tags.map((tag) => `%c[${tag.text}]`)]
    const styles = [SCOPE_STYLE, ...tags.map((tag) => tag.style ?? "")]
    if (details === undefined) {
      console.debug(header.join(" "), ...styles)
      return
    }

    console.debug(`${header.join(" ")}\n`, ...styles, details)
  }

  return {
    debug: (message, details) => write("debug", message, details),
    error: (message, details) => write("error", message, details),
    info: (message, details) => write("info", message, details),
    tagged,
    warn: (message, details) => write("warn", message, details),
  }
}
