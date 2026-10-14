import { z } from "zod"

import { createLogger } from "~/config/logger"

const logger = createLogger("OPM payload")

/*
 * Fields read forgivingly: OPM ships more often than this app, so a field it
 * drops, nulls or retypes reads as a default instead of failing the payload.
 * Only a row's `id` is required, so a row without one is dropped from its list.
 */

export const text = z.string().catch("")

export const count = z.number().catch(0)

export const flag = z.boolean().catch(false)

/** An enum as OPM sends it, by value or by name. Required, unlike the helpers around it. */
export const enumValue = z.union([z.number(), z.string()])

/**
 * Absent, null or malformed reads as `undefined`, keeping absent apart from 0 or `false`.
 *
 * @example maybe(z.number()).parse(null) // undefined
 */
export function maybe<T extends z.ZodType>(schema: T) {
  return schema.optional().catch(undefined)
}

/**
 * Keeps the rows it can read and drops the rest, logging once per kind of failure. Missing reads as `[]`.
 *
 * @example list(z.object({ id: z.string() }), "skus").parse([{ id: "a" }, {}]) // [{ id: "a" }]
 */
export function list<T extends z.ZodType>(item: T, label = "list") {
  return z
    .array(z.unknown())
    .catch([])
    .transform((rows) => {
      const parsed: z.output<T>[] = []
      for (const row of rows) {
        const result = item.safeParse(row)
        if (result.success) {
          parsed.push(result.data)
        } else {
          reportOnce(`${label}: dropped an unreadable row`, result.error)
        }
      }
      return parsed
    })
}

/**
 * The name for an enum value (OPM sends numbers, the local shelf hub names).
 * An unknown value keeps its raw text, so it never matches a known name.
 *
 * @example enumNameOf({ None: 0, ServerError: 1 }, 1) // "ServerError"
 * @example enumNameOf({ None: 0, ServerError: 1 }, 7) // "7"
 */
export function enumNameOf<E extends Record<string, number>>(
  values: E,
  value: number | string
): keyof E & string {
  if (typeof value === "string") {
    return value
  }
  // The last name wins where two share a value, as `Error` does over `Unknown` for -1.
  const names = Object.keys(values).filter((name) => values[name] === value)
  return names.at(-1) ?? String(value)
}

/**
 * An enum field, read as its name (see `enumNameOf`). Absent reads as `undefined`.
 *
 * @example enumName(RobotWorkStatus).parse(5) // "RestPosition"
 */
export function enumName<E extends Record<string, number>>(values: E) {
  return enumValue
    .optional()
    .catch(undefined)
    .transform((value) =>
      value === undefined ? undefined : enumNameOf(values, value)
    )
}

/**
 * An enum field kept as it arrived, for a value the app sends back to OPM (which
 * takes a number or a name). Use `enumName` for anything the app compares.
 *
 * @example rawEnum(StoreName).parse(1) // 1
 */
export function rawEnum<E extends Record<string, number>>(_values: E) {
  return enumValue
    .optional()
    .catch(undefined)
    .transform((value) => value as E[keyof E] | string | undefined)
}

/**
 * True when an OPM error enum carries no error: absent, `0`, or `None`.
 *
 * @example isNoneEnum(0) // true
 * @example isNoneEnum("ShelvesError") // false
 */
export function isNoneEnum(value: unknown): boolean {
  return value == null || value === 0 || value === "" || value === "None"
}

/**
 * One OPM payload, or `null` when it is missing or cannot be read at all.
 *
 * @example parse(z.object({ id: z.string() }), { id: "a" }, "store") // { id: "a" }
 */
export function parse<T extends z.ZodType>(
  schema: T,
  value: unknown,
  label: string
): z.output<T> | null {
  if (value == null) {
    return null
  }
  const result = schema.safeParse(value)
  if (!result.success) {
    reportOnce(`${label} payload did not match`, result.error)
    return null
  }
  return result.data
}

// Readers sit behind polls, so log each distinct failure once; at `error`, so it reaches Sentry.
const reported = new Set<string>()

function reportOnce(message: string, error: z.ZodError) {
  const details = z.prettifyError(error)
  const key = `${message}\n${details}`
  if (!reported.has(key)) {
    reported.add(key)
    logger.error(message, details)
  }
}
