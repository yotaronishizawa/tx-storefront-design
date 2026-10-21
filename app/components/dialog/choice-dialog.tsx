import { useRef } from "react"

import { useTranslation } from "react-i18next"

import { Button, Dialog } from "~/core"

/**
 * A question with two answers: a heading, an optional line under it, then
 * the answer and Cancel side by side (the design system's popup).
 */
export function ChoiceDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  open,
  onConfirm,
  onCancel,
}: {
  title: string
  /** Under the heading; leave empty for a heading alone. */
  message?: string
  confirmLabel: string
  cancelLabel: string
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const { t } = useTranslation("common")
  const cancelRef = useRef<HTMLButtonElement>(null)
  return (
    <Dialog.Popup
      open={open}
      onClose={onCancel}
      closeLabel={t("actions.close")}
      title={title}
      initialFocus={cancelRef}
      role="alertdialog"
      actions={
        <Dialog.Actions>
          <Button size="lg" onClick={onConfirm}>
            {confirmLabel}
          </Button>
          <Button
            ref={cancelRef}
            size="lg"
            variant="secondary"
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
        </Dialog.Actions>
      }
    >
      {message && <p className="whitespace-pre-line">{message}</p>}
    </Dialog.Popup>
  )
}
