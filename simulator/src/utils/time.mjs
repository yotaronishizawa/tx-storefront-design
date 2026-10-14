const DAY_MS = 24 * 60 * 60 * 1000

export function nowIso() {
  return new Date().toISOString()
}

export function daysAgo(days) {
  return new Date(Date.now() - days * DAY_MS).toISOString()
}

/** Unix seconds, `days` ago. */
export function unixSecondsDaysAgo(days) {
  return Math.floor((Date.now() - days * DAY_MS) / 1000)
}

/** Unix seconds, as OPM's `Utility.CurrentTimeStamp` returns. */
export function unixSeconds() {
  return Math.floor(Date.now() / 1000)
}

/** Now, as System.Text.Json writes a UTC `DateTimeOffset`. */
export function dateTimeOffsetNow() {
  return new Date().toISOString().replace("Z", "+00:00")
}
