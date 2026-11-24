import { useRef } from "react"

import { useTranslation } from "react-i18next"

import { Button, Dialog } from "~/core"

import { splitTitle } from "./split-title"

export function ConfirmDialog({
  busy = false,
  cancelLabel,
  confirmLabel,
  extraLabel,
  message,
  open,
  onCancel,
  onConfirm,
  onExtra,
}: {
  busy?: boolean
  cancelLabel: string
  confirmLabel: string
  /** A third choice, after the other two in the same row. */
  extraLabel?: string
  /** The first line is the title, the rest the body (popup writing rules). */
  message: string
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  onExtra?: () => void
}) {
  const { t } = useTranslation("common")
  const { title, body } = splitTitle(message)
  const cancelRef = useRef<HTMLButtonElement>(null)

  return (
    <Dialog.Popup
      open={open}
      onClose={busy ? undefined : onCancel}
      closeLabel={t("actions.close")}
      title={title}
      initialFocus={cancelRef}
      role="alertdialog"
      actions={
        <Dialog.Actions>
          <Button disabled={busy} size="lg" onClick={onConfirm}>
            {confirmLabel}
          </Button>
          <Button
            ref={cancelRef}
            disabled={busy}
            size="lg"
            variant="secondary"
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          {extraLabel && (
            <Button
              disabled={busy}
              size="lg"
              variant="secondary"
              onClick={onExtra}
            >
              {extraLabel}
            </Button>
          )}
        </Dialog.Actions>
      }
    >
      {body && <p className="whitespace-pre-line">{body}</p>}
    </Dialog.Popup>
  )
}
