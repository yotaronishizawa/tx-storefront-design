import type { ReactNode } from "react"

import { useTranslation } from "react-i18next"

import { Button, Dialog } from "~/core"

export function MessageDialog({
  children,
  message,
  okLabel,
  open,
  onClose,
}: {
  /** Shown under the message, e.g. photos. */
  children?: ReactNode
  message: string
  okLabel: string
  open: boolean
  onClose: () => void
}) {
  const { t } = useTranslation("common")

  return (
    <Dialog.Root
      className="grid min-h-80 max-w-dialog grid-rows-[1fr_auto] gap-6 px-8 pt-12 pb-10"
      label={t("entity.notice", { count: 1 })}
      open={open}
      role="alertdialog"
      onDismiss={onClose}
    >
      <div className="flex min-h-0 flex-col gap-4 self-center">
        <Dialog.Message>{message}</Dialog.Message>
        {children}
      </div>

      <Button className="mx-auto min-w-28 px-8" size="sm" onClick={onClose}>
        {okLabel}
      </Button>
    </Dialog.Root>
  )
}
