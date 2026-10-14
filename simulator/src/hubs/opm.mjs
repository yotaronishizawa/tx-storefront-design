/*
 * The OPM hub at `/signalr/rpc`: a handful of direct hub methods, and `Call`,
 * which wraps every OPM RPC (`rpc/`). Every method, `Call` included, goes
 * through `runWithFaults`, so the delay and faults from `/sim/*` apply.
 */
import { runWithFaults } from "../faults.mjs"
import { HubException, withErrors } from "../rpc/define.mjs"
import { callRpc } from "../rpc/index.mjs"
import { state } from "../state.mjs"
import { randomUUID } from "../utils/id.mjs"

// `ConnectInfo.SignInErrorCode`.
const SIGN_IN_ERRORS = [
  "None",
  "BadRequest",
  "InternalServerError",
  "Unauthorized",
  "RobotNotAssignedToStore",
]

export const HUB_METHODS = {
  Ping: (client) => `pong:${client.id}`,
  SignInWithID: withErrors(
    (client, [request]) => signIn(client, request ?? {}),
    SIGN_IN_ERRORS,
    (code) => signInFailure(code)
  ),
  // Faults for a `Call` apply to the RPC it names, inside `callRpc`.
  Call: (client, [methodName, args, token]) =>
    callRpc(client, String(methodName ?? ""), args ?? [], token),
  Subscribe: (client, [topic]) => {
    client.topics.add(requireTopic(topic))
    return { ok: true }
  },
  Unsubscribe: (client, [topic]) => {
    client.topics.delete(requireTopic(topic))
    return { ok: true }
  },
}

export async function invokeOpmHub(client, target, args) {
  const method = HUB_METHODS[target]
  if (!method) {
    throw new HubException(`Simulator hub method ${target} is not implemented.`)
  }
  if (target === "Call") {
    return method(client, args)
  }
  return runWithFaults(target, method, () => method(client, args))
}

// `SignalRRpcHub.Subscribe`/`Unsubscribe` refuse a blank topic.
function requireTopic(topic) {
  const name = String(topic ?? "").trim()
  if (!name) {
    throw new HubException("Topic is required.")
  }
  return name
}

/** Any non-empty agent ID signs in; the password is ignored. */
function signIn(client, request) {
  const agentId = String(request.agentId ?? "")
  if (!agentId) {
    return signInFailure(1)
  }

  const token = `sim-token-${agentId}-${randomUUID()}`
  state.tokens.set(token, agentId)
  client.token = token
  return { token: token, access: 0, storeType: 0, signInErrorCode: 0 }
}

function signInFailure(code) {
  return { token: "", access: -1, storeType: 0, signInErrorCode: code }
}
