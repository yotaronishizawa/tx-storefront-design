import { useEffect, useRef, useState } from "react"

import { useTranslation } from "react-i18next"

import { PackForwardPhotos } from "~/components/dialog/pack-forward-photos"
import { RulePhoto } from "~/components/dialog/rule-photo"
import { RuleSection } from "~/components/dialog/rule-section"
import { RulesConfirmCheckbox } from "~/components/dialog/rules-confirm-checkbox"
import { Button, Dialog } from "~/core"

const MANUAL_REPLENISHMENT_ASSETS = {
  noRemoveFromBehind: "/assets/manual-replenishment/no-remove-from-behind.png",
  noReturnDrink: "/assets/manual-replenishment/no-return-drink.png",
  okRemoveFirstDrink: "/assets/manual-replenishment/ok-remove-first-drink.png",
}

/** Start unlocks once the operator ticks the rules. */
export function ManualReplenishmentStartDialog({
  busy,
  open,
  onCancel,
  stopsRobot,
  onConfirm,
}: {
  busy: boolean
  open: boolean
  onCancel: () => void
  /** Starting stops the working robot: the button says so. */
  stopsRobot: boolean
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
      onClose={busy ? undefined : onCancel}
      closeLabel={t("common:actions.close")}
      title={t("manualStartDialogTitle")}
      size="wide"
      initialFocus={cancelRef}
      layer="base"
      actions={
        // The tick stays next to the button it unlocks, outside the scrolling rules.
        <div className="flex shrink-0 flex-col gap-4">
          <RulesConfirmCheckbox
            checked={confirmed}
            disabled={busy}
            onCheckedChange={setConfirmed}
          />
          <Dialog.Actions>
            <Button
              busy={busy}
              disabled={!confirmed}
              size="lg"
              onClick={onConfirm}
            >
              {t(
                stopsRobot
                  ? "workflow.start.stopAndStart"
                  : "startManualReplenishment"
              )}
            </Button>
            <Button
              ref={cancelRef}
              disabled={busy}
              size="lg"
              variant="secondary"
              onClick={onCancel}
            >
              {t("common:actions.cancel")}
            </Button>
          </Dialog.Actions>
        </div>
      }
    >
      <p>{t("manualStartRulesIntro")}</p>
      <RuleSection title={t("manualRulePickFromFront")}>
        <div className="grid gap-3 sm:grid-cols-2">
          <RulePhoto
            caption={t("manualRulePickSequentially")}
            src={MANUAL_REPLENISHMENT_ASSETS.okRemoveFirstDrink}
            tone="good"
          />
          <RulePhoto
            caption={t("manualRuleDoNotPickFromBack")}
            src={MANUAL_REPLENISHMENT_ASSETS.noRemoveFromBehind}
            tone="bad"
          />
        </div>
      </RuleSection>

      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <RuleSection title={t("manualRuleDoNotReturn")}>
          <RulePhoto
            caption={t("manualRuleDoNotReturnCaption")}
            src={MANUAL_REPLENISHMENT_ASSETS.noReturnDrink}
            tone="bad"
          />
        </RuleSection>

        <RuleSection title={t("manualReplenishmentCompleteForwardHint")}>
          <PackForwardPhotos />
        </RuleSection>
      </div>
    </Dialog.Popup>
  )
}
