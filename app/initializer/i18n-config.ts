import type { InitOptions } from "i18next"

import { LANGUAGES, readStoredLanguage } from "~/utils/i18n"

import { NAMESPACES, RESOURCES } from "./i18n-namespaces"

export const I18N_OPTIONS: InitOptions = {
  defaultNS: "common",
  fallbackNS: "common",
  // English is the only fully authored bundle. The Japanese default lives in
  // `readStoredLanguage()`, not here.
  fallbackLng: "en",
  // Resources are inlined, so init() resolves synchronously and `t()` never returns a raw key.
  initAsync: false,
  interpolation: { escapeValue: false },
  // The build prerenders index.html in Node, with no translated text, so hydration still matches.
  lng: typeof window === "undefined" ? "en" : readStoredLanguage(),
  load: "currentOnly",
  ns: NAMESPACES,
  react: { useSuspense: false },
  resources: RESOURCES,
  supportedLngs: LANGUAGES.map((language) => language.code),
}
