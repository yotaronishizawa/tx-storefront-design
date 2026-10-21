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
    <Dialog.Popup
      open={open}
      onClose={onClose}
      closeLabel={t("actions.close")}
      role="alertdialog"
      actions={
        <Dialog.Actions>
          <Button size="lg" onClick={onClose}>
            {okLabel}
          </Button>
        </Dialog.Actions>
      }
    >
      <p className="whitespace-pre-line">{message}</p>
      {children}
    </Dialog.Popup>
  )
}
