import { useRef } from "react"

import { useTranslation } from "react-i18next"

import { Button, Dialog } from "~/core"
import type { IllustratedRefusal } from "~/model/display-reservation"

export function DisplayReservationBlockedDialog({
  block,
  onClose,
}: {
  block: IllustratedRefusal | null
  onClose: () => void
}) {
  const { t } = useTranslation(["app", "common"])
  const okRef = useRef<HTMLButtonElement>(null)

  return (
    <Dialog.Popup
      open={block !== null}
      onClose={onClose}
      closeLabel={t("common:actions.close")}
      title={
        block === "source-blocked"
          ? t("displayReservationSourceBlockedTitle")
          : t("displayReservationOutOfStockTitle")
      }
      icon="error"
      initialFocus={okRef}
      actions={
        <Dialog.Actions>
          <Button ref={okRef} size="lg" onClick={onClose}>
            {t("common:actions.ok")}
          </Button>
        </Dialog.Actions>
      }
    >
      {block === "source-blocked" ? (
        <div className="grid gap-3 rounded-md bg-muted p-4">
          <ul className="flex flex-wrap gap-4 text-base">
            <li className="flex items-center gap-2">
              <span aria-hidden className="size-4 bg-error" />
              {t("displayReservationSourceBlockedTarget")}
            </li>
            <li className="flex items-center gap-2">
              <span
                aria-hidden
                className="size-4 border border-strong bg-muted"
              />
              {t("displayReservationSourceBlockedOther")}
            </li>
          </ul>
          <img
            alt=""
            className="mx-auto max-h-80 w-auto"
            src="/assets/display-reservation/source-blocked.png"
          />
        </div>
      ) : (
        <div className="grid place-items-center gap-3 rounded-md bg-muted p-6">
          <img
            alt=""
            className="size-48"
            src="/assets/display-reservation/out-of-stock.png"
          />
          <p className="font-bold">{t("displayReservationOutOfStockLabel")}</p>
        </div>
      )}
    </Dialog.Popup>
  )
}
