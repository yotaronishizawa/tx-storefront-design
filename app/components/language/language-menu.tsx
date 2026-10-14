import { useRef } from "react"

import { Globe2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button, Dialog } from "~/core"
import { cn } from "~/utils/cn"
import { LANGUAGES, type Language } from "~/utils/i18n"

export function LanguageMenu({
  open,
  onChange,
  onToggle,
}: {
  open: boolean
  onChange: (language: Language) => void
  onToggle: () => void
}) {
  const { i18n, t } = useTranslation(["app", "common"])
  const closeRef = useRef<HTMLButtonElement>(null)

  const currentLanguage = LANGUAGES.find((item) => item.code === i18n.language)
  const selectedLanguage = currentLanguage ?? LANGUAGES[0]

  return (
    <div className="relative">
      <Button
        variant="unstyled"
        size="unstyled"
        aria-expanded={open}
        aria-label={t("common:entity.language", { count: 1 })}
        className="h-10 gap-2 rounded-full border border-primary bg-default px-3 text-xs font-bold text-primary active:bg-muted [&_svg]:size-3.5"
        type="button"
        onClick={onToggle}
      >
        <Globe2 />
        <span>{selectedLanguage.nativeLabel}</span>
      </Button>
      <Dialog.Root
        className="max-w-5xl border p-10 text-primary"
        dismissOnScrimClick
        inset="wide"
        initialFocus={closeRef}
        layer="base"
        open={open}
        onDismiss={onToggle}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <Dialog.Title render={<p />} className="text-display">
              {t("common:actions.selectWithEntity", {
                entity: t("common:entity.language", { count: 1 }),
              })}
            </Dialog.Title>
            <p className="mt-2 text-sm font-bold text-secondary">
              {currentLanguage?.label}
            </p>
          </div>
          <Dialog.Close ref={closeRef} aria-label={t("common:actions.close")} />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LANGUAGES.map((item) => {
            const selected = i18n.language === item.code

            return (
              <Button
                variant="unstyled"
                size="unstyled"
                key={item.code}
                className={cn(
                  "flex min-h-40 items-center justify-between gap-4 rounded-lg border-2 p-6 text-left text-primary transition",
                  selected
                    ? "border-primary bg-primary-subtle"
                    : "border-default bg-default active:border-primary active:bg-primary-subtle"
                )}
                type="button"
                onClick={() => onChange(item.code)}
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-3 text-display font-bold tracking-normal">
                    <span
                      aria-hidden="true"
                      className="text-display leading-none"
                    >
                      {item.flag}
                    </span>
                    <span>{item.nativeLabel}</span>
                  </span>
                  <span className="mt-2 block text-sm font-bold text-secondary">
                    {item.label}
                  </span>
                </span>
              </Button>
            )
          })}
        </div>
      </Dialog.Root>
    </div>
  )
}
