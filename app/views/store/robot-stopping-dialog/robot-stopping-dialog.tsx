import { Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { SupportContact } from "~/components/support/support-contact"
import { Dialog, Notice } from "~/core"

/**
 * Blocks the screen while a stopped robot travels to the stop position
 * (the design system's blocking popup): says what is happening, that staff
 * must stay out until it has stopped, and closes by itself once it parks.
 */
export function RobotStoppingDialog({
  open,
  shelvesMoving,
  slow,
}: {
  open: boolean
  /** Restocking and manual start also tilt the shelves meanwhile. */
  shelvesMoving: boolean
  /** Longer than usual: say so, and who to call. */
  slow: boolean
}) {
  const { t } = useTranslation("app")
  return (
    <Dialog.Popup
      open={open}
      role="alertdialog"
      title={t("workflow.robotStopping.title")}
    >
      <div className="flex items-center gap-4">
        <Loader2
          aria-hidden="true"
          className="size-8 shrink-0 animate-spin text-primary-text"
        />
        <p>{t("workflow.robotStopping.body")}</p>
      </div>
      {/* Bold: it tells staff to stay out while the robot moves. */}
      <Notice tone="warning">{t("workflow.robotStopping.stayOut")}</Notice>
      {shelvesMoving && (
        <p className="text-secondary">{t("workflow.robotStopping.shelves")}</p>
      )}
      {slow && (
        <SupportContact
          heading={t("workflow.robotStopping.slowHeading")}
          message={t("workflow.home.attention.supportBody")}
        />
      )}
      <p className="text-base text-secondary">
        {t("workflow.robotStopping.autoClose")}
      </p>
    </Dialog.Popup>
  )
}
