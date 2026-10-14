import { createLogger } from "~/config/logger"
import { applyServiceWorkerUpdate } from "~/utils/service-worker"

const logger = createLogger("App Update")

/** Reloads into the waiting build. `reason` is for the log: the operator's tap, or the idle reload. */
export function applyAppUpdate(reason: "operator" | "inactive") {
  logger.info("Applying the new build", { reason })
  void applyServiceWorkerUpdate()
}
