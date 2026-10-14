import { useRef } from "react"

import { CircleAlert } from "lucide-react"
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
    <Dialog.Root
      className="grid max-w-3xl gap-5 p-6"
      initialFocus={okRef}
      open={block !== null}
      onDismiss={onClose}
    >
      <Dialog.Title className="flex items-center gap-3 text-left">
        <CircleAlert aria-hidden className="size-9 shrink-0 text-error" />
        {block === "source-blocked"
          ? t("displayReservationSourceBlockedTitle")
          : t("displayReservationOutOfStockTitle")}
      </Dialog.Title>

      {block === "source-blocked" ? (
        <div className="grid gap-3 rounded-md bg-muted p-4">
          <ul className="flex flex-wrap gap-4 text-xs font-bold">
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
          <p className="text-lg font-bold">
            {t("displayReservationOutOfStockLabel")}
          </p>
        </div>
      )}

      <Button ref={okRef} className="mx-auto min-w-33 px-8" onClick={onClose}>
        {t("common:actions.ok")}
      </Button>
    </Dialog.Root>
  )
}
