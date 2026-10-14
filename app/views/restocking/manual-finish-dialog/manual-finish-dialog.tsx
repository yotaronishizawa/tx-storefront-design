import { useEffect, useRef, useState } from "react"

import { TriangleAlert } from "lucide-react"
import { useTranslation } from "react-i18next"

import { PackForwardPhotos } from "~/components/dialog/pack-forward-photos"
import { RuleSection } from "~/components/dialog/rule-section"
import { RulesConfirmCheckbox } from "~/components/dialog/rules-confirm-checkbox"
import { Button, Dialog } from "~/core"

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
  const { t } = useTranslation("app")
  const cancelRef = useRef<HTMLButtonElement>(null)
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    if (open) {
      setConfirmed(false)
    }
  }, [open])

  return (
    <Dialog.Root
      className="flex max-h-[calc(100svh-2rem)] max-w-3xl flex-col overflow-hidden p-5"
      initialFocus={cancelRef}
      layer="base"
      open={open}
      onDismiss={onCancel}
    >
      <Dialog.Title className="shrink-0 text-center">
        {t("manualFinishDialogTitle")}
      </Dialog.Title>

      <Dialog.Content className="mt-3">
        <RuleSection
          subtitle={t("manualFinishPackForwardSubtitle")}
          title={t("manualFinishPackForwardTitle")}
        >
          <PackForwardPhotos />
        </RuleSection>

        <p className="mt-3 flex items-start gap-2 rounded-md border-2 border-warning bg-warning-subtle px-3 py-2 text-sm font-bold whitespace-pre-line text-primary">
          <TriangleAlert className="mt-1 size-5 shrink-0 text-warning" />
          {t("manualFinishLeaveWalkIn")}
        </p>
      </Dialog.Content>

      <RulesConfirmCheckbox
        checked={confirmed}
        disabled={false}
        onCheckedChange={setConfirmed}
      />

      <Dialog.Footer className="mt-4 grid-cols-1 gap-3 sm:grid-cols-2">
        <Button disabled={!confirmed} onClick={onConfirm}>
          {t("finishManualReplenishment")}
        </Button>
        <Button ref={cancelRef} variant="secondary" onClick={onCancel}>
          {t("manualFinishContinue")}
        </Button>
      </Dialog.Footer>
    </Dialog.Root>
  )
}
