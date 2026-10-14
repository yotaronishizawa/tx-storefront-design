/** The message of a caught value; a nullish error is "". */
export function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return String(error ?? "")
}

/** An error whose message is written for the operator, shown as-is rather than read as a lost connection. */
export class OperatorNotice extends Error {
  override name = "OperatorNotice"
}
