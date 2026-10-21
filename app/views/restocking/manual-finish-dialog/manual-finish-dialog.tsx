import { useEffect, useRef, useState } from "react"

import { useTranslation } from "react-i18next"

import { PackForwardPhotos } from "~/components/dialog/pack-forward-photos"
import { RuleSection } from "~/components/dialog/rule-section"
import { RulesConfirmCheckbox } from "~/components/dialog/rules-confirm-checkbox"
import { Button, Dialog, Notice } from "~/core"

/** Finish unlocks once the operator ticks the rules. */
export function ManualFinishDialog({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  const { t } = useTranslation(["app", "common"])
  const cancelRef = useRef<HTMLButtonElement>(null)
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    if (open) {
      setConfirmed(false)
    }
  }, [open])

  return (
    <Dialog.Popup
      open={open}
      onClose={onCancel}
      closeLabel={t("common:actions.close")}
      title={t("manualFinishDialogTitle")}
      initialFocus={cancelRef}
      layer="base"
      actions={
        // The tick stays next to the button it unlocks, outside the scrolling rules.
        <div className="flex shrink-0 flex-col gap-4">
          <RulesConfirmCheckbox
            checked={confirmed}
            disabled={false}
            onCheckedChange={setConfirmed}
          />
          <Dialog.Actions>
            <Button disabled={!confirmed} size="lg" onClick={onConfirm}>
              {t("finishManualReplenishment")}
            </Button>
            <Button
              ref={cancelRef}
              size="lg"
              variant="secondary"
              onClick={onCancel}
            >
              {t("manualFinishContinue")}
            </Button>
          </Dialog.Actions>
        </div>
      }
    >
      <RuleSection
        subtitle={t("manualFinishPackForwardSubtitle")}
        title={t("manualFinishPackForwardTitle")}
      >
        <PackForwardPhotos />
      </RuleSection>

      <Notice emphasis="outline" tone="warning">
        <span className="whitespace-pre-line">
          {t("manualFinishLeaveWalkIn")}
        </span>
      </Notice>
    </Dialog.Popup>
  )
}
