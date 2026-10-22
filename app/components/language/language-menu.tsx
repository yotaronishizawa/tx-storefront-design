import { Globe2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button, ChoiceCard, Dialog } from "~/core"
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

  const currentLanguage = LANGUAGES.find((item) => item.code === i18n.language)
  const selectedLanguage = currentLanguage ?? LANGUAGES[0]

  return (
    <div className="relative">
      <Button
        variant="unstyled"
        size="unstyled"
        aria-expanded={open}
        aria-label={t("common:entity.language", { count: 1 })}
        className="flex min-h-11 items-center gap-2 rounded-full bg-subtle px-3 text-sm font-bold active:bg-muted sm:px-4 [&_svg]:size-5"
        type="button"
        onClick={onToggle}
      >
        <Globe2 />
        <span>{selectedLanguage.nativeLabel}</span>
      </Button>
      {/* The close icon comes first in the popup, so it takes the first focus. */}
      <Dialog.Popup
        open={open}
        onClose={onToggle}
        closeLabel={t("common:actions.close")}
        title={t("common:actions.selectWithEntity", {
          entity: t("common:entity.language", { count: 1 }),
        })}
        size="wide"
        layer="base"
      >
        <div className="grid grid-cols-3 gap-4">
          {LANGUAGES.map((item) => (
            <ChoiceCard
              key={item.code}
              layout="tile"
              selected={i18n.language === item.code}
              type="button"
              onClick={() => onChange(item.code)}
              icon={
                <span className="text-display leading-none">{item.flag}</span>
              }
              title={item.nativeLabel}
              description={item.label}
            />
          ))}
        </div>
      </Dialog.Popup>
    </div>
  )
}
