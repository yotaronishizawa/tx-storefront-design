export const DAY_MS = 24 * 60 * 60 * 1000

/** Latin digits and a 24-hour clock in every language. */
export const DATE_FORMAT_BASE: Intl.DateTimeFormatOptions = {
  hourCycle: "h23",
  numberingSystem: "latn",
}

export const DATE_FORMAT_PRESETS = {
  compactClock: { hour: "2-digit", minute: "2-digit" },
  /** The footer clock. */
  clock: {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    weekday: "short",
  },
  dateTime: {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  },
} satisfies Record<string, Intl.DateTimeFormatOptions>

export type DatePreset = keyof typeof DATE_FORMAT_PRESETS
