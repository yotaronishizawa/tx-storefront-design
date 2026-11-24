import { useState, type ReactNode } from "react"

import {
  Bot,
  CalendarCheck,
  CircleHelp,
  CupSoda,
  House,
  Settings2,
  WifiOff,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { LanguageMenu } from "~/components/language/language-menu"
import { APP_ENVIRONMENT_LABEL } from "~/config/app"
import { ROUTES } from "~/config/routes"
import { Button } from "~/core"
import { cn } from "~/utils/cn"
import type { Language } from "~/utils/i18n"
import { isSamePathname } from "~/utils/pathname"

/**
 * The owner-facing work report's entry. Hidden: the report is still being
 * designed and is not ready to show (Yotaro, 2026-10-26). The page and its
 * route stay, at /work-report.
 */
const SHOW_WORK_REPORT = false

export function AppHeaderView({
  isOnline,
  isVideoTutorialOpen,
  selectedStoreName,
  pathname,
  onDrinkRefundOpen,
  onHowToUse,
  onLanguageChange,
  onSettings,
  onHome,
  onWorkReport,
  leading,
  onRobotStatus,
  robotStatus,
}: {
  isOnline: boolean
  isVideoTutorialOpen: boolean
  selectedStoreName: string
  pathname: string
  onDrinkRefundOpen?: () => void
  onHowToUse: () => void
  onLanguageChange: (language: Language) => void
  /** Kept for the shell; the help now reads the manual in the app. */
  onManualDocumentOpen?: () => void
  onSettings: () => void
  onHome: () => void
  /** Owner-facing work report; styled apart from the staff tools. */
  onWorkReport: () => void
  /** The robot popup: its status, and stopping or starting it. */
  onRobotStatus: () => void
  /** The robot's state in a word, coloured as on the idle screen. */
  robotStatus: { label: string; tone: "moving" | "rest" | "cause" }
  /** Status shown after the logo (scanner state). */
  leading?: ReactNode
}) {
  const { t } = useTranslation(["app", "common"])
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false)

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
        {SHOW_WORK_REPORT && (
          <Button
            variant="unstyled"
            size="unstyled"
            type="button"
            onClick={onWorkReport}
            className={cn(
              "flex min-h-11 items-center gap-2 rounded-full border-2 border-strong px-3 text-sm font-bold sm:px-4",
              isSamePathname(pathname, ROUTES.workReport().pathname) &&
                "ring-2 ring-primary"
            )}
            aria-label={t("workReport")}
          >
            <CalendarCheck className="size-5" />
            <span className="hidden sm:inline">{t("workReport")}</span>
          </Button>
        )}
        {/* The one way into the robot: its status, and stop or start. No
            power icon of its own, so it does not invite "stop first". */}
        <Button
          variant="unstyled"
          size="unstyled"
          type="button"
          onClick={onRobotStatus}
          className={cn(
            "flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-bold sm:px-4",
            robotStatus.tone === "moving"
              ? "bg-success text-inverse"
              : robotStatus.tone === "cause"
                ? "bg-error text-inverse"
                : "bg-subtle text-primary"
          )}
          aria-label={`${t("workflow.home.showIdle")}: ${robotStatus.label}`}
        >
          <Bot className="size-5" />
          <span className="hidden sm:inline">{robotStatus.label}</span>
        </Button>
        <Button
          variant="unstyled"
          size="unstyled"
          type="button"
          onClick={onHowToUse}
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
    </header>
  )
}
