import {
  EndManualReplenishmentErrors,
  EndRestockingErrors,
  ERROR_CODE_PREFIX,
  ForceDiscrepancyResolutionErrors,
  InvalidPnpJobContextReason,
  PauseRestockingErrors,
  PnpJobContextWarning,
  PrepareManualPnpJobErrorCode,
  RemoveSkusFromStockResult,
  SetCurrentRestockingSkuErrors,
  StartManualReplenishmentErrors,
  StartRestockingErrors,
  StartRobotOperationErrors,
  StartShelfLayoutResponseError,
  StopRobotOperationErrors,
} from "../__generated__/opm-rpc"
import { enumNameOf, isNoneEnum } from "../../shared/fields"

/** OPM's command result enums the app decodes, by their C# name. */
const OPM_ERRORS = {
  EndManualReplenishmentErrors,
  EndRestockingErrors,
  ForceDiscrepancyResolutionErrors,
  InvalidPnpJobContextReason,
  PauseRestockingErrors,
  PnpJobContextWarning,
  PrepareManualPnpJobErrorCode,
  RemoveSkusFromStockResult,
  SetCurrentRestockingSkuErrors,
  StartManualReplenishmentErrors,
  StartRestockingErrors,
  StartRobotOperationErrors,
  StartShelfLayoutResponseError,
  StopRobotOperationErrors,
} satisfies Partial<Record<keyof typeof ERROR_CODE_PREFIX, object>>

export type OpmErrorEnum = keyof typeof OPM_ERRORS

/** The error names of one enum, e.g. `OpmErrorName<"StartRestockingErrors">`. */
export type OpmErrorName<E extends OpmErrorEnum = OpmErrorEnum> =
  E extends OpmErrorEnum ? keyof (typeof OPM_ERRORS)[E] & string : never

/** A name this build does not know is kept as sent, so it matches no known name. */
export type OpmError<Name extends string = OpmErrorName> = {
  name: Name
  /** -1 when OPM sent a name this build does not know. */
  value: number
  /** What the operator reads to the call centre; `null` when there is no value to build it from. */
  code: string | null
}

/**
 * The support code for one enum value, as OPM's `ErrorCode.ForEnum` computes it:
 * `S` + prefix×1000 + value.
 *
 * @example supportCode(502, 13) // "S502013"
 */
function supportCode(prefix: number, value: number): string {
  return `S${String(prefix * 1000 + value).padStart(6, "0")}`
}

/**
 * The support code for one value by name, for an enum whose 0 is a real value
 * (`PnpJobContextWarning.DestinationFull`). `null` for a name this build does not know.
 *
 * @example enumSupportCode("DestinationFull", "PnpJobContextWarning") // "S300000"
 * @example enumSupportCode("SmartShelvesNotReady", "PnpJobContextWarning") // "S300202"
 */
export function enumSupportCode(
  name: string,
  enumName: OpmErrorEnum
): string | null {
  const values: Record<string, number> = OPM_ERRORS[enumName]
  return Object.hasOwn(values, name)
    ? supportCode(ERROR_CODE_PREFIX[enumName], values[name])
    : null
}

/**
 * One OPM error field, by value or by name. `null` for no error (`None`, 0 or
 * absent; `RemoveSkusFromStockResult` calls its 0 `Success`).
 *
 * @example decodeOpmError(13, "StartRestockingErrors") // { name: "StopRobotOperationError", value: 13, code: "S502013" }
 * @example decodeOpmError("None", "StartRestockingErrors") // null
 */
export function decodeOpmError<E extends OpmErrorEnum>(
  raw: unknown,
  enumName?: E
): OpmError<OpmErrorName<E>> | null {
  if (isNoneEnum(raw) || (typeof raw !== "number" && typeof raw !== "string")) {
    return null
  }

  const values: Record<string, number> = enumName ? OPM_ERRORS[enumName] : {}
  const numeric = typeof raw === "number" ? raw : Number(raw)
  const value = Number.isInteger(numeric) ? numeric : (values[raw] ?? -1)
  if (value === 0) {
    return null
  }

  const isKnown = value >= 0
  const name = isKnown ? enumNameOf(values, value) : String(raw)
  const code =
    enumName && value > 0
      ? supportCode(ERROR_CODE_PREFIX[enumName], value)
      : null
  return { name: name as OpmErrorName<E>, value, code }
}
