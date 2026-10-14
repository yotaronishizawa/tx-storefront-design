import { useRef } from "react"

import { ArrowRight, ArrowRightLeft, LogOut } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button, Dialog } from "~/core"

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
    <Dialog.Root
      className="max-h-[90dvh] max-w-dialog overflow-auto p-5 sm:p-8"
      initialFocus={cancelRef}
      open={open}
      onDismiss={busy ? undefined : onCancel}
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <Dialog.Title className="text-xl">
          {t("workflow.handoff.title")}
        </Dialog.Title>
        <Button
          ref={cancelRef}
          disabled={busy}
          variant="secondary"
          onClick={onCancel}
        >
          {t("common:actions.cancel")}
        </Button>
      </div>
      {mode === "manual" && (
        <div className="mb-4 flex items-center gap-4 rounded-xl bg-subtle p-3">
          <img
            alt=""
            src="/assets/manual-replenishment/move-in-front.png"
            className="h-20 w-24 shrink-0 rounded-lg object-contain"
          />
          <p className="text-base/relaxed font-bold">
            {t("workflow.handoff.packForward")}
          </p>
        </div>
      )}
      <div className="grid gap-4">
        {canContinue && (
          <Button
            className="min-h-24 justify-start gap-4 text-left whitespace-normal"
            disabled={busy}
            variant="secondary"
            onClick={onContinue}
          >
            <ArrowRightLeft className="size-7 shrink-0" />
            <span className="flex-1">
              <span className="block text-xl font-bold">
                {t(
                  mode === "restock"
                    ? "workflow.handoff.toManual"
                    : "workflow.handoff.toRestock"
                )}
              </span>
              <span className="mt-1 block text-base font-medium text-secondary">
                {t("workflow.handoff.continueHint")}
              </span>
            </span>
            <ArrowRight className="size-5 shrink-0" />
          </Button>
        )}
        <div className="rounded-xl bg-primary-subtle p-4">
          <p className="mb-4 text-base/relaxed font-bold">
            {t("workflow.handoff.outsideHint")}
          </p>
          <Button
            busy={busy}
            className="min-h-16 w-full text-lg whitespace-normal"
            icon={<LogOut />}
            onClick={onFinish}
          >
            {t("workflow.handoff.finish")}
          </Button>
        </div>
      </div>
    </Dialog.Root>
  )
}
