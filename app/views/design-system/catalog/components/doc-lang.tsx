import { createContext, useContext, type ReactNode } from "react"

export type DocLang = "en" | "ja"

/** A string the catalog shows in either language; a plain string is the same in both. */
export type DocText = string | { en: string; ja: string }

const DocLangContext = createContext<DocLang>("en")

export function DocLangProvider({
  lang,
  children,
}: {
  lang: DocLang
  children: ReactNode
}) {
  return (
    <DocLangContext.Provider value={lang}>{children}</DocLangContext.Provider>
  )
}

/** The catalog's own two languages, kept apart from the app's locale files. */
export function useDocText() {
  const lang = useContext(DocLangContext)
  return (text: DocText) => (typeof text === "string" ? text : text[lang])
}
