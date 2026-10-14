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
  onConfirm,
}: {
  busy: boolean
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
    <Dialog.Root
      className="flex max-h-[calc(100svh-2rem)] max-w-4xl flex-col overflow-hidden p-5"
      initialFocus={cancelRef}
      layer="base"
      open={open}
      onDismiss={busy ? undefined : onCancel}
    >
      <Dialog.Title className="shrink-0 text-center">
        {t("manualStartDialogTitle")}
      </Dialog.Title>

      <Dialog.Content>
        <p className="mb-3 text-center text-xs font-bold text-primary">
          {t("manualStartRulesIntro")}
        </p>
        <RuleSection title={t("manualRulePickFromFront")}>
          <div className="grid min-h-0 flex-1 gap-3 sm:grid-cols-2">
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

        <div className="mt-3 grid gap-3 lg:grid-cols-[0.85fr_1.15fr]">
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
      </Dialog.Content>

      <RulesConfirmCheckbox
        checked={confirmed}
        disabled={busy}
        onCheckedChange={setConfirmed}
      />

      <Dialog.Footer className="mt-4 grid-cols-1 gap-3 sm:grid-cols-2">
        <Button busy={busy} disabled={!confirmed} onClick={onConfirm}>
          {t("startManualReplenishment")}
        </Button>
        <Button
          ref={cancelRef}
          disabled={busy}
          variant="secondary"
          onClick={onCancel}
        >
          {t("common:actions.cancel")}
        </Button>
      </Dialog.Footer>
    </Dialog.Root>
  )
}
