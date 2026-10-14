import { opmHub } from "./client"
import { stopSubscriptions } from "./subscriptions"

export {
  call,
  ensureConnection,
  isOpmConnected,
  isOpmStopped,
  onOpmConnectionChange,
  onReconnected,
  reconnectOpm,
  setTokenRefreshHandler,
} from "./client"
export { isMethodNotAllowedError, isUnauthorizedError } from "./errors"
export {
  subscribeToSmartShelvesStatus,
  subscribeToStockSkuChanges,
} from "./subscriptions"
export * from "./methods/manual-job"
export * from "./methods/restocking"
export * from "./methods/robot"
export * from "./methods/shelf"
export * from "./methods/store"
export * from "./methods/tasks"

/** Closes the connection on purpose: sign-out and app teardown. The next call reopens it. */
export function stopOpm(): Promise<void> {
  stopSubscriptions()
  return opmHub.stop()
}
