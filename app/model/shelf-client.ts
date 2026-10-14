/** The shelf client's last report to OPM, from its smart shelves status. */
export type ShelfClientReport = {
  /** Tablet time, in ms, when `reportedAt` last moved on. */
  receivedAt: number
  reportedAt: string
  version: string
}

/** OPM's `CanStartManualReplenishment` minimum. */
export const MANUAL_REPLENISHMENT_MIN_SHELF_CLIENT = [1, 3, 1] as const

/** OPM counts the shelf client unreachable once its report is this old. */
const SHELF_CLIENT_TIMEOUT_MS = 30_000

const DATE_BUILD_VERSION = /^\d{4}\.\d{1,2}\.\d{1,2}\.\d{4}$/

/**
 * OPM's version rule: a legacy `x.y.z` version is compared; a date build
 * (`yyyy.MM.dd.HHmm`, optional `_suffix`) is newer than every legacy one, so it
 * always passes; anything else fails.
 *
 * @example isShelfClientVersionAtLeast("1.3.0", [1, 3, 1]) // false
 * @example isShelfClientVersionAtLeast("2026.09.14.1840_main", [1, 3, 1]) // true
 */
export function isShelfClientVersionAtLeast(
  version: string,
  minimum: readonly number[]
): boolean {
  const trimmed = version.trim()
  if (DATE_BUILD_VERSION.test(trimmed.split("_")[0])) {
    return true
  }
  // Leading digits and dots only, as OPM parses it: "1.3.2-rc" → 1.3.2.
  const prefix = /^[\d.]*/.exec(trimmed)?.[0] ?? ""
  const parts = prefix.split(".")
  if (parts.length < 2 || parts.length > 4 || parts.some((part) => !part)) {
    return false
  }
  const numbers = parts.map(Number)
  for (let index = 0; index < minimum.length; index += 1) {
    // An absent part sorts below any present one.
    const value = numbers[index] ?? -1
    const floor = minimum[index]
    if (value !== floor) {
      return value > floor
    }
  }
  return true
}

/**
 * Whether OPM would call the shelf client unreachable. The report must be old
 * by the tablet's clock and have stopped moving on, so a tablet clock running
 * ahead of the server never refuses a live shelf; OPM still has the last word.
 */
export function isShelfClientReportStale(
  report: ShelfClientReport,
  now: Date
): boolean {
  const reportedAt = Date.parse(report.reportedAt)
  const silentFor = now.getTime() - report.receivedAt
  return (
    silentFor > SHELF_CLIENT_TIMEOUT_MS &&
    (Number.isNaN(reportedAt) ||
      now.getTime() - reportedAt > SHELF_CLIENT_TIMEOUT_MS)
  )
}

/** The report to keep after a poll: `receivedAt` only moves when `reportedAt` does. */
export function nextShelfClientReport(
  previous: ShelfClientReport | null,
  status: { reportedAt: string; version: string },
  now: number
): ShelfClientReport {
  const moved = !previous || previous.reportedAt !== status.reportedAt
  return { ...status, receivedAt: moved ? now : previous.receivedAt }
}
