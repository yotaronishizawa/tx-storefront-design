import { useEffect, useRef } from "react"

import { TriangleAlert } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button, Dialog } from "~/core"
import {
  readRestockingState,
  useCurrentScanAlert,
  useLaneErrorOverlayReport,
  useLaneErrorPrompt,
} from "~/domains/restocking"
import { useErrorLaneIds } from "~/domains/shelf"
import { AudioCues, playStoreAudioAfterCurrent } from "~/utils/audio"

/** The popup a blocking lane error raises. Closing a size-constraint popup opens the next lane to fix. */
export function LaneErrorDialog() {
  const { t } = useTranslation(["app", "common"])
  const { open, prompt } = useLaneErrorPrompt()
  const errorLaneIds = useErrorLaneIds()
  const errorLaneCount = errorLaneIds.length
  const scanAlert = useCurrentScanAlert()
  useLaneErrorVoiceOnReturn(open, prompt?.kind, errorLaneIds)
  useLaneErrorOverlayReport()

  const promptKey = prompt?.key ?? ""
  const promptKind = prompt?.kind
  useEffect(() => {
    const restocking = readRestockingState()
    if (!promptKey) {
      restocking.setDismissedLaneErrorKey("")
    } else if (
      promptKind === "unscanned" &&
      scanAlert?.kind === "no-scanned-drink"
    ) {
      restocking.setDismissedLaneErrorKey(promptKey)
    }
  }, [promptKey, promptKind, scanAlert?.kind])

  useEffect(() => () => readRestockingState().setDismissedLaneErrorKey(""), [])

  function close() {
    const restocking = readRestockingState()
    restocking.setDismissedLaneErrorKey(promptKey)
    if (promptKind === "constraint") {
      restocking.setNextErrorLaneRequested(true)
    }
  }

  return (
    <Dialog.Root
      className="grid max-w-dialog gap-6 p-6"
      // No visible heading; the count is the dialog's accessible name.
      label={t("laneErrorCount", { count: Math.max(errorLaneCount, 1) })}
      open={open}
      role="alertdialog"
      onDismiss={close}
    >
      <div className="flex items-start gap-3">
        <TriangleAlert
          aria-hidden
          className="size-7 shrink-0 text-error"
          strokeWidth={2.5}
        />
        <Dialog.Message className="text-left font-bold">
          {promptKind === "constraint"
            ? t("laneErrorPromptConstraint")
            : t("laneErrorPromptUnscanned")}
        </Dialog.Message>
      </div>

      {/* The code is what the operator reads out to the operations centre. */}
      <ul className="grid gap-1 text-xs font-bold text-secondary">
        {prompt?.details.map((detail) => (
          <li key={detail.code}>
            {t(detail.messageKey)}{" "}
            <span className="whitespace-nowrap">
              {t("laneErrorCode", { code: detail.code })}
            </span>
          </li>
        ))}
      </ul>

      <Button className="w-full" onClick={close}>
        {t("common:actions.ok")}
      </Button>
    </Dialog.Root>
  )
}

/**
 * Replays the voice when the popup comes back with no new red lane (one of
 * several errors cleared, or a clean add while errors remain). A new error
 * already got its voice from the lane event, so that case stays silent.
 */
function useLaneErrorVoiceOnReturn(
  open: boolean,
  kind: "constraint" | "unscanned" | undefined,
  errorLaneIds: string[]
) {
  const wasOpen = useRef(false)
  const laneIdsAtLastOpen = useRef<string[] | null>(null)

  useEffect(() => {
    if (open && !wasOpen.current) {
      const previous = laneIdsAtLastOpen.current
      const noNewLane =
        previous !== null && errorLaneIds.every((id) => previous.includes(id))
      if (noNewLane && kind) {
        void playStoreAudioAfterCurrent(
          kind === "constraint"
            ? AudioCues.CannotReplenish
            : AudioCues.NoScannedItem
        )
      }
      laneIdsAtLastOpen.current = errorLaneIds
    }
    if (errorLaneIds.length === 0) {
      laneIdsAtLastOpen.current = null
    }
    wasOpen.current = open
  }, [errorLaneIds, kind, open])
}
