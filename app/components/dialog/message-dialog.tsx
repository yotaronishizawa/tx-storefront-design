import type { ReactNode } from "react"

import { useTranslation } from "react-i18next"

import { Button, Dialog } from "~/core"

import { splitTitle } from "./split-title"

export function MessageDialog({
  children,
  message,
  okLabel,
  open,
  onClose,
}: {
  /** Shown under the message, e.g. photos. */
  children?: ReactNode
  /** The first line is the title, the rest the body (popup writing rules). */
  message: string
  okLabel: string
  open: boolean
  onClose: () => void
}) {
  const { t } = useTranslation("common")
  const { title, body } = splitTitle(message)

  return (
    <Dialog.Popup
      open={open}
      onClose={onClose}
      closeLabel={t("actions.close")}
      title={title}
      role="alertdialog"
      actions={
        <Dialog.Actions>
          <Button size="lg" onClick={onClose}>
            {okLabel}
          </Button>
        </Dialog.Actions>
      }
    >
      {body && <p className="whitespace-pre-line">{body}</p>}
      {children}
    </Dialog.Popup>
  )
}
