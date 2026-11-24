import { useEffect, useRef } from "react"

import { useTranslation } from "react-i18next"

import { isRestockStudy } from "~/config/restock-study"
import { Button, Dialog } from "~/core"
import {
  readRestockingState,
  useCurrentScanAlert,
  useLaneErrorOverlayReport,
  useLaneErrorPrompt,
} from "~/domains/restocking"
import { useErrorLaneIds } from "~/domains/shelf"
import { AudioCues, playStoreAudioAfterCurrent } from "~/utils/audio"

import { RestockErrorPopup } from "./restock-error-popup"

/** The popup a blocking lane error raises. Closing a size-constraint popup opens the next lane to fix. */
export function LaneErrorDialog() {
  const { t } = useTranslation(["app", "common"])
  const { open, prompt } = useLaneErrorPrompt()
  const errorLaneIds = useErrorLaneIds()
  const errorLaneCount = errorLaneIds.length
  const scanAlert = useCurrentScanAlert()
  // The study says every red lane its own way, with no voice replayed.
  const study = isRestockStudy()
  useLaneErrorVoiceOnReturn(open && !study, prompt?.kind, errorLaneIds)
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

  if (study) {
    return <RestockErrorPopup />
  }

  return (
    <Dialog.Popup
      open={open}
      onClose={close}
      closeLabel={t("common:actions.close")}
      title={t("laneErrorCount", { count: Math.max(errorLaneCount, 1) })}
      icon="error"
      role="alertdialog"
      actions={
        <Dialog.Actions>
          <Button size="lg" onClick={close}>
            {t("common:actions.ok")}
          </Button>
        </Dialog.Actions>
      }
    >
      <p className="whitespace-pre-line">
        {promptKind === "constraint"
          ? t("laneErrorPromptConstraint")
          : t("laneErrorPromptUnscanned")}
      </p>

      {/* The code is what the operator reads out to the operations centre. */}
      <ul className="grid gap-1 text-base text-secondary">
        {prompt?.details.map((detail) => (
          <li key={detail.code}>
            {t(detail.messageKey)}{" "}
            <span className="font-bold whitespace-nowrap">
              {t("laneErrorCode", { code: detail.code })}
            </span>
          </li>
        ))}
      </ul>
    </Dialog.Popup>
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
