import { useRef, useState, type ReactNode } from "react"

import {
  BookOpen,
  CircleHelp,
  CupSoda,
  House,
  Settings2,
  Video,
  WifiOff,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { LanguageMenu } from "~/components/language/language-menu"
import { ManualSearch } from "~/components/manual-search/manual-search"
import { APP_ENVIRONMENT_LABEL } from "~/config/app"
import { ROUTES } from "~/config/routes"
import { Button, Dialog } from "~/core"
import { cn } from "~/utils/cn"
import type { Language } from "~/utils/i18n"
import { isSamePathname } from "~/utils/pathname"

export function AppHeaderView({
  isOnline,
  isVideoTutorialOpen,
  selectedStoreName,
  pathname,
  onDrinkRefundOpen,
  onHowToUse,
  onLanguageChange,
  onManualDocumentOpen,
  onSettings,
  onHome,
  leading,
}: {
  isOnline: boolean
  isVideoTutorialOpen: boolean
  selectedStoreName: string
  pathname: string
  onDrinkRefundOpen?: () => void
  onHowToUse: () => void
  onLanguageChange: (language: Language) => void
  onManualDocumentOpen: () => void
  onSettings: () => void
  onHome: () => void
  /** Status shown after the logo (scanner state). */
  leading?: ReactNode
}) {
  const { t } = useTranslation(["app", "common"])
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false)

  const [helpOpen, setHelpOpen] = useState(false)
  const [helpSearching, setHelpSearching] = useState(false)
  const closeHelpRef = useRef<HTMLButtonElement>(null)
  const isHome = isSamePathname(pathname, ROUTES.home().pathname)

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-default bg-default px-3 sm:h-18 sm:px-6">
      <div className="flex min-w-0 items-center gap-3 sm:gap-6">
        <Button
          variant="unstyled"
          size="unstyled"
          aria-label={t("common:nav.home")}
          className="flex min-h-11 min-w-0 items-center gap-3 rounded-lg px-1 text-left"
          type="button"
          onClick={onHome}
        >
          <img
            alt="TX"
            className="size-8 shrink-0 object-contain sm:size-9"
            draggable={false}
            src="/tx-logo-dark.png"
          />
          {!isHome && (
            <span className="flex items-center gap-2 text-sm font-bold sm:text-base">
              <House className="size-5" />
              <span className="hidden sm:inline">{t("common:nav.home")}</span>
            </span>
          )}
          {APP_ENVIRONMENT_LABEL && (
            <span className="rounded-md bg-default px-2 py-1 text-xs font-bold text-secondary">
              {APP_ENVIRONMENT_LABEL}
            </span>
          )}
        </Button>
        {leading}
      </div>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
        {!isOnline && (
          <span className="inline-flex items-center gap-1 rounded-md bg-error-subtle p-2 text-sm font-bold text-error">
            <WifiOff className="size-4" />
            <span className="hidden sm:inline">{t("offlineMode")}</span>
          </span>
        )}
        <Button
          variant="unstyled"
          size="unstyled"
          type="button"
          onClick={() => setHelpOpen(true)}
          className={cn(
            "flex min-h-11 items-center gap-2 rounded-full bg-subtle px-3 text-sm font-bold sm:px-4",
            isVideoTutorialOpen && "ring-2 ring-primary"
          )}
          aria-label={t("howToUse")}
        >
          <CircleHelp className="size-5" />
          <span className="hidden sm:inline">{t("howToUse")}</span>
        </Button>
        {onDrinkRefundOpen && (
          <Button
            variant="unstyled"
            size="unstyled"
            type="button"
            className="flex min-h-11 items-center gap-2 rounded-full bg-subtle px-3 text-sm font-bold"
            aria-label={t("drinkRefund")}
            onClick={onDrinkRefundOpen}
          >
            <CupSoda className="size-5" />
            <span className="hidden sm:inline">{t("drinkRefund")}</span>
          </Button>
        )}
        <LanguageMenu
          open={isLanguageMenuOpen}
          onChange={(language) => {
            onLanguageChange(language)
            setIsLanguageMenuOpen(false)
          }}
          onToggle={() => setIsLanguageMenuOpen((current) => !current)}
        />
        <Button
          variant="unstyled"
          size="unstyled"
          type="button"
          onClick={onSettings}
          aria-label={`${t("common:nav.settings")}: ${selectedStoreName}`}
          title={selectedStoreName}
          className={cn(
            "grid size-11 place-items-center rounded-full bg-subtle",
            isSamePathname(pathname, ROUTES.settings().pathname) &&
              "ring-2 ring-primary"
          )}
        >
          <Settings2 className="size-5" />
        </Button>
      </div>
      <Dialog.Root
        open={helpOpen}
        onDismiss={() => setHelpOpen(false)}
        initialFocus={closeHelpRef}
        className="w-240 max-w-[calc(100vw-2rem)] p-6 sm:p-8"
      >
        <div className="mb-6 flex items-center justify-between gap-3">
          <Dialog.Title>{t("howToUse")}</Dialog.Title>
          <Dialog.Close
            ref={closeHelpRef}
            aria-label={t("common:actions.close")}
          />
        </div>
        <ManualSearch onSearchingChange={setHelpSearching} />
        <div className={cn("mt-6 grid gap-3", helpSearching && "hidden")}>
          <Button
            variant="secondary"
            className="min-h-18 justify-start gap-4 text-lg"
            onClick={() => {
              setHelpOpen(false)
              onHowToUse()
            }}
          >
            <Video className="size-6" />
            {t("howToUse")}
          </Button>
          <Button
            variant="secondary"
            className="min-h-18 justify-start gap-4 text-lg"
            onClick={() => {
              setHelpOpen(false)
              onManualDocumentOpen()
            }}
          >
            <BookOpen className="size-6" />
            {t("manualDocument")}
          </Button>
        </div>
      </Dialog.Root>
    </header>
  )
}
