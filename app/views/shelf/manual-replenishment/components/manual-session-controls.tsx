import { Play } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { RequestContext } from "~/api/opm/schemas"
import { Button } from "~/core"
import { isActiveRequest, isRequestInProgress } from "~/model/request-state"
import type { BusyAction } from "~/types/busy-action"

/** Start while no task is open, Finish while one runs; a paused task offers both. */
export function ManualSessionControls({
  available,
  busyAction,
  request,
  onFinish,
  onStart,
}: {
  /** The store has a shelf client, without which OPM refuses to start. */
  available: boolean
  busyAction: BusyAction
  request?: RequestContext
  onFinish: () => void
  onStart: () => void
}) {
  const { t } = useTranslation("app")
  const open = isActiveRequest(request)
  const inProgress = open && isRequestInProgress(request)
  const starting = busyAction === "start-manual"
  const ending = busyAction === "end-manual"

  const start = (
    <Button
      busy={starting}
      disabled={!available || ending}
      icon={<Play />}
      size="sm"
      type="button"
      onClick={onStart}
    >
      {t(open ? "resumeManualReplenishment" : "startManualReplenishment")}
    </Button>
  )
  const finish = (
    <Button
      busy={ending}
      disabled={starting}
      size="sm"
      type="button"
      variant={inProgress ? "primary" : "secondary"}
      onClick={onFinish}
    >
      {t(inProgress ? "restockingComplete" : "finishManualReplenishment")}
    </Button>
  )

  if (!open) {
    return start
  }
  if (inProgress) {
    return finish
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      {start}
      {finish}
    </div>
  )
}
