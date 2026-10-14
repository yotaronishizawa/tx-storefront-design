import {
  DATE_FORMAT_BASE,
  DATE_FORMAT_PRESETS,
  DAY_MS,
  type DatePreset,
} from "~/config/date"

type DateInput = Date | number | string | null | undefined

const formatters = new Map<string, Intl.DateTimeFormat>()

function getFormatter(preset: DatePreset, language: string) {
  const key = `${preset}:${language}`
  let formatter = formatters.get(key)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(language, {
      ...DATE_FORMAT_BASE,
      ...DATE_FORMAT_PRESETS[preset],
    })
    formatters.set(key, formatter)
  }
  return formatter
}

/** `null` for a missing or unparseable value. */
function toDate(value: DateInput): Date | null {
  if (value == null || value === "") {
    return null
  }
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * Empty for a missing or unparseable value.
 *
 * @example formatDate("2026-09-24T10:52:00Z", "dateTime", "ja") // "2026/09/24 19:52" in Asia/Tokyo
 */
export function formatDate(
  value: DateInput,
  preset: DatePreset,
  language: string
): string {
  const date = toDate(value)
  return date ? getFormatter(preset, language).format(date) : ""
}

/**
 * Whole days elapsed, never negative. `null` when the date is unknown.
 *
 * @example getDaysSince("2026-09-20T00:00:00Z", new Date("2026-09-25T12:00:00Z")) // 5
 */
export function getDaysSince(value: DateInput, now: Date): number | null {
  const date = toDate(value)
  if (!date) {
    return null
  }
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / DAY_MS))
}
