import { errorMessage } from "~/utils/error-message"
import { asRecord } from "~/utils/record"

/** A thrown `Unauthorized`, by message, name, status or code. */
export function isUnauthorizedError(error: unknown): boolean {
  if (typeof error === "string") {
    return hasUnauthorizedText(error)
  }
  const record = asRecord(error)
  return [
    record.message,
    record.errorMessage,
    record.name,
    record.status,
    record.statusCode,
    record.code,
    record.errorCode,
  ].some((value) => hasUnauthorizedText(String(value ?? "")))
}

/** The hub's own refusal: a `SignalRRpcHubResult` of `{ ok: false, errorCode: "Unauthorized" }` in place of the answer. */
export function isUnauthorizedResult(result: unknown): boolean {
  const { ok, errorCode } = asRecord(result)
  return (
    ok === false &&
    typeof errorCode === "string" &&
    errorCode.toLowerCase() === "unauthorized"
  )
}

/** An older OPM without the method. */
export function isMethodNotAllowedError(error: unknown): boolean {
  return /Method '([^']+)' is not allowed/.test(errorMessage(error))
}

function hasUnauthorizedText(value: string): boolean {
  return /\b(unauthorized|401)\b/i.test(value)
}

/** Some answers come wrapped as `{ data }`. */
export function unwrapResponse(value: unknown): unknown {
  const { data } = asRecord(value)
  return data === undefined ? value : data
}

export function isConnectionStateError(error: unknown): boolean {
  return /connection is not in the 'connected' state/i.test(errorMessage(error))
}
