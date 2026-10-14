import { Play, Send } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { RequestContext } from "~/api/opm/schemas"
import { Button } from "~/core"
import { isRequestInProgress } from "~/model/request-state"
import type { BusyAction } from "~/types/busy-action"

/** A paused request offers both resume and end. */
export function RestockingActionButton({
  blocked,
  busyAction,
  restockRequest,
  onEndRestocking,
  onStartRestocking,
}: {
  blocked: boolean
  busyAction: BusyAction
  restockRequest?: RequestContext
  onEndRestocking: () => void
  onStartRestocking: () => void
}) {
  const { t } = useTranslation(["app", "common"])

  const inProgress = isRequestInProgress(restockRequest)
  const paused = restockRequest !== undefined && !inProgress
  const starting = busyAction === "start-restocking"
  const sending =
    busyAction === "end-restocking" || busyAction === "end-restocking-to-manual"
  const busy = starting || sending
  const disabled = busy || blocked

  const start = (
    <Button
      busy={starting}
      className="w-full"
      disabled={disabled}
      icon={<Play />}
      size="sm"
      type="button"
      onClick={onStartRestocking}
    >
      {paused ? t("restockingResume") : t("stockReplenishStart")}
    </Button>
  )

  if (!restockRequest) {
    return start
  }

  const end = (
    <Button
      busy={sending}
      className="w-full"
      disabled={disabled}
      icon={<Send />}
      size="sm"
      type="button"
      variant={inProgress ? "primary" : "secondary"}
      onClick={onEndRestocking}
    >
      {inProgress ? t("common:actions.send") : t("endRestocking")}
    </Button>
  )

  if (inProgress) {
    return end
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {start}
      {end}
    </div>
  )
}
