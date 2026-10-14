import { useState, type ReactNode } from "react"

import {
  BadgeInfo,
  Clock,
  Download,
  LogOut,
  RefreshCw,
  ShieldCheck,
  StoreIcon,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import type { Store } from "~/api/opm/schemas"
import { ConfirmDialog } from "~/components/dialog/confirm-dialog"
import { Button, Combobox, ToggleGroup } from "~/core"
import { getLocalizedStoreName } from "~/model/sku"
import type { BusyAction } from "~/types/busy-action"

import { SettingsSection } from "./components/settings-section"
import { refreshPwaContent } from "./utils/pwa-refresh"
import { downloadRootCertificateFile } from "./utils/root-certificate"

const SECTION_ICON_CLASS = "size-7 text-primary-text"

export function SettingsView({
  appVersion,
  busyAction,
  idleTimeoutMs,
  idleTimeoutOptionsMs,
  isOnline,
  selectedStoreId,
  stores,
  titleLeading,
  onRefresh,
  onSignOut,
  onStoreChange,
  onIdleTimeoutChange,
}: {
  appVersion: string
  busyAction: BusyAction
  /** How long Home sits untouched before the idle screen shows. */
  idleTimeoutMs: number
  idleTimeoutOptionsMs: readonly number[]
  isOnline: boolean
  selectedStoreId: string
  stores: Store[]
  titleLeading?: ReactNode
  onRefresh: () => void
  onSignOut: () => void
  onStoreChange: (storeId: string) => void
  onIdleTimeoutChange: (timeoutMs: number) => void
}) {
  const { i18n, t } = useTranslation(["app", "common"])

  const [updatingPwaContent, setUpdatingPwaContent] = useState(false)
  const [downloadingRootCertificate, setDownloadingRootCertificate] =
    useState(false)
  const [confirmingSignOut, setConfirmingSignOut] = useState(false)

  const selectedStore = stores.find((store) => store.id === selectedStoreId)
  const selectedStoreName = selectedStore
    ? getLocalizedStoreName(selectedStore, i18n.language)
    : t("common:selection.none", {
        entity: t("common:entity.store", { count: 1 }),
      })

  async function updatePwaContent() {
    setUpdatingPwaContent(true)
    await refreshPwaContent()
  }

  async function downloadRootCertificate() {
    setDownloadingRootCertificate(true)
    try {
      await downloadRootCertificateFile()
    } finally {
      setDownloadingRootCertificate(false)
    }
  }

  return (
    <section className="min-h-0 flex-1 overflow-auto rounded-lg border bg-default p-6">
      <div className="max-w-5xl">
        <div className="flex items-start gap-4">
          {titleLeading}
          <div className="min-w-0">
            <p className="text-sm font-bold text-primary-text">
              {t("storeApp")}
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-normal text-primary">
              {t("common:nav.settings")}
            </h1>
          </div>
        </div>

        <div className="mt-6 grid gap-6">
          <SettingsSection
            description={selectedStoreName}
            icon={<StoreIcon className={SECTION_ICON_CLASS} />}
            title={t("storeApp")}
            truncateDescription
          >
            <div className="flex min-w-[min(100%,620px)] flex-wrap justify-end gap-3">
              <Combobox.Root
                aria-label={t("common:entity.store", { count: 1 })}
                className="h-14 flex-1 rounded-md border border-strong bg-default px-4 text-base font-bold text-primary focus-within:border-primary focus-within:ring-2 focus-within:ring-primary"
                disabled={stores.length === 0}
                emptyText={t("storeSearchEmpty")}
                options={stores.map((store) => ({
                  detail: store.robotId,
                  label: getLocalizedStoreName(store, i18n.language),
                  value: store.id,
                }))}
                placeholder={t("storeSearchPlaceholder")}
                value={selectedStoreId}
                onValueChange={onStoreChange}
              />
              <Button
                aria-label={t("common:actions.refresh")}
                disabled={!isOnline}
                type="button"
                onClick={onRefresh}
                variant="secondary"
                size="lg"
                busy={busyAction === "refresh"}
                icon={<RefreshCw />}
              >
                {t("common:actions.refresh")}
              </Button>
              <Button
                aria-label={t("common:actions.logout")}
                type="button"
                onClick={() => setConfirmingSignOut(true)}
                variant="secondary"
                size="lg"
                icon={<LogOut />}
              >
                {t("common:actions.logout")}
              </Button>
            </div>
          </SettingsSection>

          <SettingsSection
            description={t("idleScreenTimeoutHint")}
            icon={<Clock className={SECTION_ICON_CLASS} />}
            title={t("idleScreenTimeout")}
          >
            <ToggleGroup
              className="flex flex-wrap justify-end gap-2"
              itemClassName={(selected) =>
                selected
                  ? "h-12 min-w-24 rounded-md bg-primary px-4 text-base font-bold text-on-primary"
                  : "h-12 min-w-24 rounded-md border border-strong bg-default px-4 text-base font-bold text-primary"
              }
              options={idleTimeoutOptionsMs.map((ms) => ({
                value: String(ms),
                label:
                  ms === 0
                    ? t("idleScreenOff")
                    : ms < 60_000
                      ? t("idleScreenSeconds", { count: ms / 1000 })
                      : t("idleScreenMinutes", { count: ms / 60_000 }),
              }))}
              value={String(idleTimeoutMs)}
              onValueChange={(value) => onIdleTimeoutChange(Number(value))}
            />
          </SettingsSection>

          <SettingsSection
            icon={<BadgeInfo className={SECTION_ICON_CLASS} />}
            title={t("guideApplicationVersion")}
          >
            <p className="h-14 min-w-[min(100%,320px)] content-center rounded-md border bg-default px-4 text-right text-base font-bold text-secondary">
              {appVersion}
            </p>
          </SettingsSection>

          <SettingsSection
            description={t("updatePwaContentHint")}
            icon={<RefreshCw className={SECTION_ICON_CLASS} />}
            title={t("updatePwaContent")}
          >
            <Button
              aria-label={t("updatePwaContent")}
              className="min-w-56"
              type="button"
              onClick={() => void updatePwaContent()}
              variant="secondary"
              size="lg"
              busy={updatingPwaContent}
              icon={<RefreshCw />}
            >
              {t("updatePwaContent")}
            </Button>
          </SettingsSection>

          <SettingsSection
            description={t("rootCertificateHint")}
            icon={<ShieldCheck className={SECTION_ICON_CLASS} />}
            title={t("rootCertificate")}
          >
            <Button
              aria-label={t("downloadRootCertificate")}
              className="min-w-56"
              type="button"
              onClick={() => void downloadRootCertificate()}
              variant="secondary"
              size="lg"
              busy={downloadingRootCertificate}
              icon={<Download />}
            >
              {t("downloadRootCertificate")}
            </Button>
          </SettingsSection>
        </div>
      </div>

      <ConfirmDialog
        cancelLabel={t("common:boolean.no")}
        confirmLabel={t("common:boolean.yes")}
        message={t("logoutConfirm")}
        open={confirmingSignOut}
        onCancel={() => setConfirmingSignOut(false)}
        onConfirm={onSignOut}
      />
    </section>
  )
}
