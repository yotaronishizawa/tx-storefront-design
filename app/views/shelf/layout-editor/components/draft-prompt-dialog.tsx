import { useTranslation } from "react-i18next"

import { ConfirmDialog } from "~/components/dialog/confirm-dialog"

export function DraftPromptDialog({
  open,
  onApply,
  onSkip,
}: {
  open: boolean
  onApply: () => void
  onSkip: () => void
}) {
  const { t } = useTranslation(["app", "common"])

  return (
    <ConfirmDialog
      cancelLabel={t("skipDraft")}
      confirmLabel={t("applyDraft")}
      message={t("layoutDraftAvailable")}
      open={open}
      onCancel={onSkip}
      onConfirm={onApply}
    />
  )
}
