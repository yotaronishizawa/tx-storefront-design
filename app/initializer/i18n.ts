import i18n from "i18next"
import ICU from "i18next-icu"
import { initReactI18next } from "react-i18next"

import { storeLanguage, type Language, type Translate } from "~/utils/i18n"

import { I18N_OPTIONS } from "./i18n-config"

if (!i18n.isInitialized) {
  void i18n.use(ICU).use(initReactI18next).init(I18N_OPTIONS)
}

/** For non-component code; reads the current language at call time. Components use `useTranslation()`. */
export const translate: Translate = i18n.getFixedT(null, ["app", "common"])

export function readLanguage(): string {
  return i18n.language
}

export function changeLanguage(nextLanguage: Language) {
  storeLanguage(nextLanguage)
  void i18n.changeLanguage(nextLanguage)
}
