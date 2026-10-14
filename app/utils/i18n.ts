import type { TFunction } from "i18next"

import { readStorage, writeStorage } from "./local-storage"

export type Language = "en" | "ja" | "ne" | "zh" | "bn"

/** i18next's conventional storage key. */
const LANGUAGE_KEY = "i18nextLng"

/** Fresh installs open in Japanese. */
const DEFAULT_LANGUAGE: Language = "ja"

export const LANGUAGES: {
  code: Language
  flag: string
  label: string
  nativeLabel: string
}[] = [
  { code: "en", flag: "🇺🇸", label: "English", nativeLabel: "English" },
  { code: "ja", flag: "🇯🇵", label: "Japanese", nativeLabel: "日本語" },
  { code: "ne", flag: "🇳🇵", label: "Nepali", nativeLabel: "नेपाली" },
  { code: "zh", flag: "🇨🇳", label: "Chinese", nativeLabel: "中文" },
  { code: "bn", flag: "🇧🇩", label: "Bengali", nativeLabel: "বাংলা" },
]

/** The `app` namespace translate function with `common` as its fallback; keys are typed in `app/types/i18next.d.ts`. */
export type Translate = TFunction<["app", "common"]>

export function readStoredLanguage(): Language {
  const stored = readStorage(LANGUAGE_KEY)
  const supported = LANGUAGES.find((language) => language.code === stored)
  return supported?.code ?? DEFAULT_LANGUAGE
}

export function storeLanguage(language: Language): void {
  writeStorage(LANGUAGE_KEY, language)
}
