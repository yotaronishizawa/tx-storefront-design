import { useRef } from "react"

import { ArrowRightLeft, CircleCheckBig } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button, ChoiceCard, Dialog, Notice } from "~/core"

export function FinishWorkDialog({
  mode,
  canContinue = true,
  open,
  busy,
  onCancel,
  onContinue,
  onFinish,
}: {
  mode: "restock" | "manual"
  canContinue?: boolean
  open: boolean
  busy: boolean
  onCancel: () => void
  onContinue: () => void
  onFinish: () => void
}) {
  const { t } = useTranslation(["app", "common"])
  const cancelRef = useRef<HTMLButtonElement>(null)
  return (
    <Dialog.Popup
      open={open}
      onClose={busy ? undefined : onCancel}
      closeLabel={t("common:actions.close")}
      title={t("workflow.handoff.title")}
      initialFocus={cancelRef}
      actions={
        <Dialog.Actions>
          <Button
            busy={busy}
            icon={<CircleCheckBig />}
            size="lg"
            onClick={onFinish}
          >
            {t("workflow.handoff.finish")}
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
      }
    >
      {mode === "manual" && (
        <div className="flex items-center gap-4">
          <img
            alt=""
            src="/assets/manual-replenishment/move-in-front.png"
            className="h-20 w-24 shrink-0 rounded-lg object-contain"
          />
          <p>{t("workflow.handoff.packForward")}</p>
        </div>
      )}
      {canContinue && (
        <ChoiceCard
          chevron
          description={t("workflow.handoff.continueHint")}
          disabled={busy}
          icon={<ArrowRightLeft />}
          title={t(
            mode === "restock"
              ? "workflow.handoff.toManual"
              : "workflow.handoff.toRestock"
          )}
          onClick={onContinue}
        />
      )}
      <Notice tone="warning">{t("workflow.handoff.outsideHint")}</Notice>
    </Dialog.Popup>
  )
}
