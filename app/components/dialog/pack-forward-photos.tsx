import { useTranslation } from "react-i18next"

import { RulePhoto } from "./rule-photo"

/** The "pack the stock forward" good/bad photo pair for manual replenishment's start and finish. */
export function PackForwardPhotos() {
  const { t } = useTranslation("app")

  return (
    <div className="grid min-h-0 flex-1 gap-3 sm:grid-cols-2">
      <RulePhoto
        caption={t("manualRuleMoveForwardGood")}
        src="/assets/manual-replenishment/move-in-front.png"
        tone="good"
      />
      <RulePhoto
        caption={t("manualRuleMoveForwardBad")}
        src="/assets/manual-replenishment/no-space-in-front.png"
        tone="bad"
      />
    </div>
  )
}
