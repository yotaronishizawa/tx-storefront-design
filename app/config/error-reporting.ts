// The app's port to Sentry. Sentry itself is loaded only by the client entry
// (`initializer/sentry.ts` installs the reporter), so the build's prerender,
// which runs every module in Node, never resolves it. Uninstalled, every call
// here is a no-op.

/** Who and where; an empty value clears its field. */
export type OperatorScope = {
  agentId: string
  storeId: string
  robotId: string
}

export type ErrorReporter = {
  log: (
    level: "warn" | "error",
    scope: string,
    line: string,
    details: unknown
  ) => void
  setOperatorScope: (operator: OperatorScope) => void
}

let reporter: ErrorReporter | null = null

export function installErrorReporter(next: ErrorReporter): void {
  reporter = next
}

export function reportLog(
  level: "warn" | "error",
  scope: string,
  line: string,
  details: unknown
): void {
  reporter?.log(level, scope, line, details)
}

/**
 * Tags every later report with the operator; the tablet is shared, so sign-out clears it.
 *
 * @example setOperatorScope({ agentId: "agent-1", storeId: "S01", robotId: "" })
 * // reports carry user "agent-1" and store "S01", and no robot
 */
export function setOperatorScope(operator: OperatorScope): void {
  reporter?.setOperatorScope(operator)
}

export function clearOperatorScope(): void {
  setOperatorScope({ agentId: "", storeId: "", robotId: "" })
}
