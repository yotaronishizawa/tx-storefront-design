import { useEffect, useMemo, useState } from "react"

import { Download, Share2, X } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "~/core"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

function isStandaloneDisplay(): boolean {
  const navigatorWithStandalone = window.navigator as Navigator & {
    standalone?: boolean
  }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  )
}

function isIosLikeDevice(): boolean {
  const userAgent = window.navigator.userAgent
  const platform = window.navigator.platform
  const touchPoints = window.navigator.maxTouchPoints

  return (
    /iPad|iPhone|iPod/.test(userAgent) ||
    (platform === "MacIntel" && touchPoints > 1)
  )
}

export function PwaInstallPromptView() {
  const { t } = useTranslation(["app", "common"])

  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [standalone, setStandalone] = useState(true)
  const isIos = useMemo(() => isIosLikeDevice(), [])

  useEffect(() => {
    setStandalone(isStandaloneDisplay())

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
      setStandalone(false)
    }

    function handleInstalled() {
      setStandalone(true)
      setDeferredPrompt(null)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleInstalled)

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      )
      window.removeEventListener("appinstalled", handleInstalled)
    }
  }, [])

  // iOS has no install prompt, so it gets Share-sheet instructions instead.
  const canOfferInstall = Boolean(deferredPrompt) || isIos
  if (standalone || dismissed || !canOfferInstall) {
    return null
  }

  async function install() {
    if (!deferredPrompt) {
      return
    }

    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    if (choice.outcome === "accepted") {
      setDismissed(true)
    }
    setDeferredPrompt(null)
  }

  return (
    <aside className="fixed right-5 bottom-5 z-50 flex w-90 max-w-[calc(100vw-2.5rem)] items-center gap-3 rounded-xl border bg-default p-3 text-primary shadow-dialog">
      <img
        alt=""
        className="size-11 shrink-0 rounded-md bg-default object-contain"
        draggable={false}
        src="/tx-logo-white-bg.png"
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold">{t("installApp")}</p>
        <p className="mt-1 text-xs/snug text-secondary">
          {deferredPrompt ? t("installAppPrompt") : t("installIosPrompt")}
        </p>
        {deferredPrompt && (
          <Button
            variant="primary"
            size="sm"
            className="mt-2"
            type="button"
            onClick={install}
          >
            <Download className="size-4" />
            {t("common:actions.install")}
          </Button>
        )}
      </div>
      {!deferredPrompt && <Share2 className="size-5 shrink-0 text-secondary" />}
      <Button
        variant="unstyled"
        size="unstyled"
        aria-label={t("common:actions.close")}
        className="absolute top-2 right-2 rounded-full p-1 text-secondary active:bg-muted"
        type="button"
        onClick={() => setDismissed(true)}
      >
        <X className="size-4" />
      </Button>
    </aside>
  )
}
