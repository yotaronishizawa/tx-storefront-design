import { RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "~/core"

/** Says a new build is ready; it applies on Reload, or by itself once the tablet sits idle. */
export function AppUpdateBannerView({
  open,
  onReload,
}: {
  open: boolean
  onReload: () => void
}) {
  const { t } = useTranslation("app")

  if (!open) {
    return null
  }

  return (
    <aside
      role="status"
      className="fixed bottom-5 left-5 z-50 flex w-100 max-w-[calc(100vw-2.5rem)] items-center gap-3 rounded-xl border bg-default p-3 text-primary shadow-dialog"
    >
      <RefreshCw className="size-6 shrink-0 text-info" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold">{t("appUpdateReady")}</p>
        <p className="mt-1 text-xs/snug text-secondary">
          {t("appUpdateReadyHint")}
        </p>
      </div>
      <Button variant="primary" size="sm" type="button" onClick={onReload}>
        {t("appUpdateReload")}
      </Button>
    </aside>
  )
}
