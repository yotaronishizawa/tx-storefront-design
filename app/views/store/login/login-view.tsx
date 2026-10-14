import type { FormEventHandler, ReactNode } from "react"

import { BookOpen, WifiOff } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { Credentials } from "~/api/opm/schemas"
import { HeaderActionButton } from "~/components/button/header-action-button"
import { AppScreen } from "~/components/layout/app-screen"
import { AppStatusFooter } from "~/components/layout/app-status-footer"
import { APP_ENVIRONMENT_LABEL, APP_VERSION_LABEL } from "~/config/app"
import { Button, Field } from "~/core"
import type { ScannerConnectionSource } from "~/model/scanner-scan"

import { PasswordField } from "./components/password-field"

export function LoginView({
  children,
  isOnline,
  isRestockingInProgress,
  login,
  loginState,
  scannerConnected,
  scannerConnectionSource,
  patchLogin,
  onManualDocumentOpen,
  onOpenScannerRecovery,
  onSubmit,
}: {
  children: ReactNode
  isOnline: boolean
  isRestockingInProgress: boolean
  login: Credentials
  loginState: "idle" | "loading"
  scannerConnected: boolean
  scannerConnectionSource: ScannerConnectionSource
  patchLogin: (patch: Partial<Credentials>) => void
  onManualDocumentOpen: () => void
  onOpenScannerRecovery: () => void
  onSubmit: FormEventHandler<HTMLFormElement>
}) {
  const { t } = useTranslation(["app", "common"])

  return (
    <AppScreen>
      <header className="flex min-h-15 shrink-0 items-center justify-between gap-4 px-5">
        <Button
          variant="unstyled"
          size="unstyled"
          aria-label={t("storeApp")}
          className="flex min-w-0 items-center gap-3 text-left"
          type="button"
        >
          <img
            alt="TX"
            className="size-8 shrink-0 object-contain"
            draggable={false}
            src="/tx-logo-dark.png"
          />
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-3">
              <h1 className="truncate text-lg font-bold tracking-normal">
                {t("storeApp")}
              </h1>
              {APP_ENVIRONMENT_LABEL && (
                <span className="shrink-0 rounded-full bg-error px-4 py-1 text-sm font-bold tracking-wider text-inverse">
                  {APP_ENVIRONMENT_LABEL}
                </span>
              )}
            </div>
            <p className="mt-1 truncate text-xs leading-none font-bold text-secondary">
              {APP_VERSION_LABEL}
            </p>
          </div>
        </Button>

        <HeaderActionButton onClick={onManualDocumentOpen}>
          <BookOpen />
          {t("manualDocument")}
        </HeaderActionButton>
      </header>

      <section className="relative z-10 mx-5 grid min-h-0 flex-1 grid-cols-1 overflow-hidden rounded-xl border bg-subtle lg:grid-cols-[1fr_1fr]">
        <section className="relative hidden min-h-0 overflow-hidden lg:block">
          <img
            alt=""
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 w-[70%] max-w-2xl -translate-1/2 object-contain opacity-55 brightness-0 invert select-none"
            draggable={false}
            src="/tx-logo-dark.png"
          />
          <Button
            variant="unstyled"
            size="unstyled"
            className="absolute bottom-9 left-8 inline-flex h-8 min-w-28 items-center justify-center rounded-full border bg-default px-5 text-xs font-bold text-primary transition active:bg-muted"
            type="button"
            onClick={onManualDocumentOpen}
          >
            {t("manualDocument")}
          </Button>
        </section>

        <section className="flex min-h-0 items-center justify-center rounded-xl bg-default p-4">
          <form
            className="flex size-full max-w-145 flex-col items-center justify-center px-10 py-12"
            onSubmit={onSubmit}
          >
            <div className="w-full max-w-75">
              <h2 className="border-l-4 border-primary pl-2 text-xl font-bold tracking-normal">
                {t("common:actions.login")}
              </h2>

              <div className="mt-24">
                <Field.Root>
                  <Field.Label htmlFor="agentId">{t("loginId")}</Field.Label>
                  <Field.Control
                    id="agentId"
                    autoComplete="username"
                    className="mt-1 h-8 w-full rounded-md border border-strong bg-default px-4 text-xs font-bold text-primary focus:ring-2 focus:ring-primary"
                    placeholder={t("loginId")}
                    value={login.agentId}
                    onChange={(event) =>
                      patchLogin({ agentId: event.target.value })
                    }
                    required
                  />
                </Field.Root>

                <PasswordField
                  value={login.password}
                  onChange={(password) => patchLogin({ password })}
                />
              </div>

              <Button
                variant="primary"
                size="sm"
                className="mt-12 w-full"
                busy={loginState === "loading"}
                disabled={!isOnline}
                type="submit"
              >
                {t("common:actions.login")}
              </Button>
            </div>
          </form>
        </section>
      </section>
      {!isOnline && (
        <div className="fixed right-5 bottom-5 flex items-center gap-2 rounded-md border border-warning bg-warning-subtle px-3 py-2 text-xs font-bold text-primary shadow-dialog">
          <WifiOff className="size-4 text-warning" />
          {t("offlineMode")}
        </div>
      )}
      <AppStatusFooter
        isRestockingInProgress={isRestockingInProgress}
        scannerConnected={scannerConnected}
        scannerConnectionSource={scannerConnectionSource}
        onOpenScannerRecovery={onOpenScannerRecovery}
      />
      {children}
    </AppScreen>
  )
}
