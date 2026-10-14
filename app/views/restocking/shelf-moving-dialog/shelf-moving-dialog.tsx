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
    <Dialog.Root
      className="flex max-w-dialog flex-col items-center gap-6 px-8 py-12"
      open={open}
      role="alertdialog"
    >
      <Loader2 aria-hidden className="size-12 animate-spin text-primary-text" />
      <Dialog.Message className="text-center">
        {t("smartShelfMovingStayOut")}
      </Dialog.Message>
    </Dialog.Root>
  )
}
