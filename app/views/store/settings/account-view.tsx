import { useRef, useState } from "react"

import { ChevronLeft, LogOut, UserRound } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button, Dialog } from "~/core"

import { SettingsSection } from "./components/settings-section"

const SECTION_ICON_CLASS = "size-7 text-primary-text"

/**
 * Sign out lives one screen below Settings on purpose: signing back in can
 * take a store a long time, so it must never be one stray tap away.
 */
export function AccountView({
  agentId,
  onBack,
  onSignOut,
}: {
  agentId: string
  onBack: () => void
  onSignOut: () => void
}) {
  const { t } = useTranslation(["app", "common"])
  const [confirming, setConfirming] = useState(false)
  const cancelRef = useRef<HTMLButtonElement>(null)

  return (
    <section className="min-h-0 flex-1 overflow-auto rounded-lg border bg-default p-6">
      <div className="max-w-5xl">
        <div className="flex items-center gap-4">
          <Button
            icon={<ChevronLeft />}
            size="lg"
            type="button"
            variant="secondary"
            onClick={onBack}
          >
            {t("common:nav.settings")}
          </Button>
          <h1 className="text-xl font-bold tracking-normal text-primary">
            {t("settingsAccount")}
          </h1>
        </div>

        <div className="mt-6 grid gap-6">
          <SettingsSection
            description={agentId}
            icon={<UserRound className={SECTION_ICON_CLASS} />}
            title={t("loginId")}
          >
            <Button
              icon={<LogOut />}
              size="lg"
              type="button"
              variant="secondary"
              onClick={() => setConfirming(true)}
            >
              {t("common:actions.logout")}
            </Button>
          </SettingsSection>
        </div>
      </div>

      {/* Both buttons stay quiet and Cancel takes focus: here the safe
          answer is not to sign out. */}
      <Dialog.Popup
        open={confirming}
        onClose={() => setConfirming(false)}
        closeLabel={t("common:actions.close")}
        title={t("signOutTitle")}
        initialFocus={cancelRef}
        role="alertdialog"
        actions={
          <Dialog.Actions>
            <Button
              icon={<LogOut />}
              size="lg"
              variant="secondary"
              onClick={onSignOut}
            >
              {t("common:actions.logout")}
            </Button>
            <Button
              ref={cancelRef}
              size="lg"
              variant="secondary"
              onClick={() => setConfirming(false)}
            >
              {t("common:actions.cancel")}
            </Button>
          </Dialog.Actions>
        }
      >
        <p>{t("signOutBody")}</p>
      </Dialog.Popup>
    </section>
  )
}
