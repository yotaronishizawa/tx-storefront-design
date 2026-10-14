/**
 * An RPC whose failures OPM reports inside the answer. `errors` is OPM's enum:
 * an array indexed by value, or a `{ value: name }` object when the values
 * have gaps. Value 0 is success. `fail(code)` builds the answer carrying `code`.
 */
export function withErrors(handler, errors, fail) {
  return Object.assign(handler, { errors: toPairs(errors), fail })
}

/**
 * A command that stops or restarts the robot and reports that step's error.
 * `failRobot(code, run)` builds the failed answer; `run()` runs the command.
 */
export function withRobotErrors(handler, robotErrors, failRobot) {
  return Object.assign(handler, {
    robotErrors: toPairs(robotErrors),
    failRobot,
  })
}

/** An RPC that can fail with only `errorDetail` set; `failDetail()` builds it. */
export function withDetailOnlyError(handler, failDetail) {
  return Object.assign(handler, { failDetail })
}

function toPairs(errors) {
  return Array.isArray(errors)
    ? errors.map((name, value) => [value, name])
    : Object.entries(errors).map(([value, name]) => [Number(value), name])
}

/**
 * The exception OPM throws on purpose. SignalR sends its message to the
 * client; any other exception reaches it only as a generic failure.
 */
export class HubException extends Error {}
