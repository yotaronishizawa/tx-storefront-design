/**
 * `value` as a plain object to read fields from; anything else reads as `{}`.
 *
 * @example asRecord({ ok: true }).ok // true
 * @example asRecord(null).ok // undefined
 */
export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}
