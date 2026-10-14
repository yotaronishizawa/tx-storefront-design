import { useRef } from "react"

import { useTranslation } from "react-i18next"

import { Button, Dialog } from "~/core"

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
  /** A third choice, under the other two. */
  extraLabel?: string
  message: string
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  onExtra?: () => void
}) {
  const { t } = useTranslation("common")
  const cancelRef = useRef<HTMLButtonElement>(null)

  return (
    <Dialog.Root
      className="grid min-h-75 max-w-dialog grid-rows-[1fr_auto] px-8 pt-12 pb-10"
      initialFocus={cancelRef}
      label={t("actions.confirm")}
      open={open}
      role="alertdialog"
      onDismiss={busy ? undefined : onCancel}
    >
      <Dialog.Message className="self-center">{message}</Dialog.Message>

      <Dialog.Footer className="max-w-dialog-sm">
        <Button disabled={busy} size="sm" onClick={onConfirm}>
          {confirmLabel}
        </Button>
        <Button
          ref={cancelRef}
          disabled={busy}
          size="sm"
          variant="secondary"
          onClick={onCancel}
        >
          {cancelLabel}
        </Button>
        {extraLabel && (
          <Button
            className="col-span-2"
            disabled={busy}
            size="sm"
            variant="secondary"
            onClick={onExtra}
          >
            {extraLabel}
          </Button>
        )}
      </Dialog.Footer>
    </Dialog.Root>
  )
}
