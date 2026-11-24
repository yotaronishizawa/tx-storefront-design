import { useTranslation } from "react-i18next"
import { Outlet, useLocation, useNavigate } from "react-router"

import { AppHeaderScannerStatus } from "~/components/layout/app-header-status"
import { AppScreen } from "~/components/layout/app-screen"
import { FEATURES } from "~/config/feature"
import { ROUTES } from "~/config/routes"
import {
  useIdleScreenShown,
  useIsDialogOpen,
  useOpenDialog,
  useOpenVideoTutorial,
} from "~/domains/app-shell"
import { useScannerBattery, useScannerConnected } from "~/domains/restocking"
import { useSelectedStore } from "~/domains/store-selection"
import { useOnlineStatus } from "~/hooks/use-online-status"
import { changeLanguage } from "~/initializer/i18n"
import { getLocalizedStoreName } from "~/model/sku"
import { cn } from "~/utils/cn"
import { openManualDocument } from "~/utils/manual-document"
import { isSamePathname } from "~/utils/pathname"
import { getVideoTutorialCategory } from "~/utils/video-tutorials"
import { AppHeaderView } from "~/views/store/app-header"

import { AppDialogs } from "./_components/app-dialogs"
import { useRobotStatusBadge } from "./_hooks/use-robot-status-badge"

/** Signed-in pages: a header (with scanner status) over one full-width content panel. */
export default function ChromeLayout() {
  const { i18n, t } = useTranslation(["app", "common"])

  const selectedStore = useSelectedStore()
  const selectedStoreName = selectedStore
    ? getLocalizedStoreName(selectedStore, i18n.language)
    : t("common:selection.none", {
        entity: t("common:entity.store", { count: 1 }),
      })
  const scannerConnected = useScannerConnected()
  const scannerBattery = useScannerBattery()
  const isOnline = useOnlineStatus()
  const isVideoTutorialOpen = useIsDialogOpen("video-tutorial")
  const openDialog = useOpenDialog()
  const openVideoTutorial = useOpenVideoTutorial()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  // The idle screen is read from across the walk-in: no header, nothing to
  // press but the screen itself (Yotaro 2026-11-04).
  const idleScreenShown = useIdleScreenShown()
  const robotStatus = useRobotStatusBadge()

  return (
    <AppScreen>
      {!idleScreenShown && (
        <AppHeaderView
          isOnline={isOnline}
          isVideoTutorialOpen={isVideoTutorialOpen}
          selectedStoreName={selectedStoreName}
          pathname={pathname}
          onDrinkRefundOpen={
            FEATURES.drinkRefundFormUrl
              ? () =>
                  window.open(
                    FEATURES.drinkRefundFormUrl,
                    "_blank",
                    "noopener,noreferrer"
                  )
              : undefined
          }
          onHome={() => navigate(ROUTES.home().pathname)}
          onHowToUse={() =>
            openVideoTutorial(getVideoTutorialCategory(pathname))
          }
          onLanguageChange={changeLanguage}
          onManualDocumentOpen={openManualDocument}
          onSettings={() => {
            if (!isSamePathname(pathname, ROUTES.settings().pathname)) {
              void navigate(ROUTES.settings().pathname)
              return
            }
            // Pressed again on Settings: close it, back to where staff were.
            const idx = (window.history.state as { idx?: number } | null)?.idx
            void (idx ? navigate(-1) : navigate(ROUTES.home().pathname))
          }}
          onRobotStatus={() => openDialog("robot-power")}
          robotStatus={robotStatus}
          onWorkReport={() => navigate(ROUTES.workReport().pathname)}
          leading={
            <AppHeaderScannerStatus
              scannerConnected={scannerConnected}
              battery={scannerBattery}
              onOpenScannerRecovery={() => openDialog("scanner-recovery")}
              onOpenScannerHelp={() => openDialog("scanner-help")}
            />
          }
        />
      )}

      <section
        className={cn(
          "relative z-10 flex min-h-0 flex-1 flex-col bg-subtle",
          // Home runs its panels edge to edge, from the header to the bottom.
          !isSamePathname(pathname, ROUTES.home().pathname) && "p-4"
        )}
      >
        {/* Keyed on the path so every page change replays the view transition. */}
        <div key={pathname} className="view-transition flex min-h-0 flex-1">
          <Outlet />
        </div>
      </section>

      <AppDialogs />
    </AppScreen>
  )
}
