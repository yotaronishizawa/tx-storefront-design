import { useRef } from "react"

import { Button, Dialog } from "~/core"

/**
 * A question with two answers, laid out as the walk-in popups are designed
 * (Figma "ポップアップ:中に入る" / "ウォークインから出る"): a left-aligned
 * heading, an optional line under it, then the answer and Cancel side by side.
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
  const cancelRef = useRef<HTMLButtonElement>(null)
  return (
    <Dialog.Root
      className="grid w-172 max-w-[calc(100vw-2rem)] gap-8 rounded-[1.25rem] p-6"
      initialFocus={cancelRef}
      open={open}
      role="alertdialog"
      onDismiss={onCancel}
    >
      <div className="grid gap-4">
        <Dialog.Title className="text-xl/snug">{title}</Dialog.Title>
        {message && (
          <Dialog.Message className="text-left text-base/relaxed font-normal">
            {message}
          </Dialog.Message>
        )}
      </div>
      <div className="grid grid-cols-[minmax(0,1.13fr)_minmax(0,1fr)] gap-4">
        <Button
          size="lg"
          className="h-16 rounded-xl text-lg whitespace-nowrap"
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
        <Button
          ref={cancelRef}
          size="lg"
          variant="secondary"
          className="h-16 rounded-xl text-lg"
          onClick={onCancel}
        >
          {cancelLabel}
        </Button>
      </div>
    </Dialog.Root>
  )
}
