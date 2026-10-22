/** The scanner's battery as the header shows it. */
export type ScannerBattery = "ok" | "low" | "critical" | "unknown"

/** At or under this, "電量残少". A first guess: confirm with the scanner's spec. */
export const SCANNER_BATTERY_LOW_PERCENT = 20
/** At or under this, "要充電". A first guess, as above. */
export const SCANNER_BATTERY_CRITICAL_PERCENT = 10

/**
 * `level` is the scanner's battery in percent, as tx-stock-shelf would relay
 * it in `scannerStatus.batteryLevel` (assumed name: no scanner reports one
 * yet). `undefined`: the field is not sent at all, so nothing is shown.
 * `null`: sent but unknown, shown as "電量 --".
 */
export function scannerBatteryFrom(
  level: number | null | undefined
): ScannerBattery | undefined {
  if (level === undefined) return undefined
  if (level === null) return "unknown"
  if (level <= SCANNER_BATTERY_CRITICAL_PERCENT) return "critical"
  if (level <= SCANNER_BATTERY_LOW_PERCENT) return "low"
  return "ok"
}
