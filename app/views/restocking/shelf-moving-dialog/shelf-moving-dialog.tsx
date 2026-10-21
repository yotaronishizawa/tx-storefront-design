import { Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Dialog } from "~/core"

/**
 * Blocks the screen while the shelves tilt for Start and End. Not dismissable;
 * it closes when the command answers.
 */
export function ShelfMovingDialog({ open }: { open: boolean }) {
  const { t } = useTranslation("app")

  return (
    <Dialog.Popup open={open} role="alertdialog">
      <div className="flex items-center gap-4">
        <Loader2
          aria-hidden
          className="size-8 shrink-0 animate-spin text-primary-text"
        />
        {/* Bold: it tells staff to stay out while the shelves move. */}
        <Dialog.Message className="text-left">
          {t("smartShelfMovingStayOut")}
        </Dialog.Message>
      </div>
    </Dialog.Popup>
  )
}
