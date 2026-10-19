import { useEffect, useMemo, useState } from "react"

import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Phone,
  Search,
  X,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"

import { OPERATIONS_CENTER_PHONE } from "~/config/app"
import { Button, Input } from "~/core"
import {
  loadManualIndex,
  MANUAL_PAGE_IMAGE_BASE,
  manualPicksFor,
  searchManual,
  shortcutsFor,
  type ManualDoc,
  type ManualPage,
} from "~/utils/manual-search"

const MAX_HITS = 30

/**
 * Staff mostly know the app; they open the manual to look one thing up. So
 * the help starts with a search box: type a word, get the manual pages that
 * say it, read the page right here. When the manual has nothing, say so and
 * give the operations centre's number.
 */
export function ManualSearch({
  pathname,
  onSearchingChange,
  onLeave,
}: {
  /** The help closes before a shortcut takes staff to another screen. */
  onLeave: () => void
  /** The screen behind the help: its likely questions come first. */
  pathname: string
  /** True while a search or a page is on screen (the help hides its buttons). */
  onSearchingChange: (searching: boolean) => void
}) {
  const { t } = useTranslation("app")
  const navigate = useNavigate()
  const [docs, setDocs] = useState<ManualDoc[] | null>(null)
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState<ManualPage | null>(null)

  useEffect(() => {
    let alive = true
    void loadManualIndex().then((loaded) => {
      if (alive) setDocs(loaded)
    })
    return () => {
      alive = false
    }
  }, [])

  const hits = useMemo(
    () => (docs ? searchManual(docs, query).slice(0, MAX_HITS) : []),
    [docs, query]
  )
  const shortcuts = useMemo(() => shortcutsFor(query), [query])
  const picks = useMemo(
    () => (docs ? manualPicksFor(docs, pathname) : []),
    [docs, pathname]
  )
  const searching = query.trim().length > 0 || open !== null
  useEffect(() => onSearchingChange(searching), [onSearchingChange, searching])

  if (open) {
    const { doc, page } = open
    return (
      <div className="grid gap-4">
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="unstyled"
            size="unstyled"
            type="button"
            onClick={() => setOpen(null)}
            className="flex min-h-11 items-center gap-1 rounded-full ps-2 pe-4 text-lg font-bold active:bg-subtle"
          >
            <ChevronLeft aria-hidden="true" className="size-6" />
            {t("manualSearch.back")}
          </Button>
          <a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center gap-2 rounded-full border border-black/20 px-4 text-base font-bold"
          >
            {t("manualSearch.openDeck")}
            <ExternalLink aria-hidden="true" className="size-5" />
          </a>
        </div>
        <p className="text-xl font-bold">
          {doc.headings[page] || doc.title}
          <span className="ms-3 text-lg font-medium text-secondary">
            {doc.title}
          </span>
          <span className="ms-3 text-lg font-medium text-secondary">
            {t("manualSearch.pageOf", {
              page: page + 1,
              total: doc.pages.length,
            })}
          </span>
        </p>
        <img
          src={MANUAL_PAGE_IMAGE_BASE + doc.images[page]}
          alt={doc.pages[page]}
          className="max-h-[58svh] w-full rounded-lg object-contain ring-1 ring-black/10"
        />
        <div className="flex justify-between gap-3">
          <Button
            variant="secondary"
            className="h-14 gap-2 px-6 text-lg"
            disabled={page === 0}
            onClick={() => setOpen({ doc, page: page - 1 })}
          >
            <ChevronLeft aria-hidden="true" className="size-6" />
            {t("manualSearch.previous")}
          </Button>
          <Button
            variant="secondary"
            className="h-14 gap-2 px-6 text-lg"
            disabled={page === doc.pages.length - 1}
            onClick={() => setOpen({ doc, page: page + 1 })}
          >
            {t("manualSearch.next")}
            <ChevronRight aria-hidden="true" className="size-6" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      <label className="flex h-16 items-center gap-3 rounded-full border-2 border-black/20 px-5 focus-within:border-strong">
        <Search aria-hidden="true" className="size-6 shrink-0 text-secondary" />
        <Input
          value={query}
          onValueChange={setQuery}
          placeholder={t("manualSearch.placeholder")}
          aria-label={t("manualSearch.placeholder")}
          className="h-full flex-1 text-xl"
        />
        {query && (
          <Button
            variant="unstyled"
            size="unstyled"
            type="button"
            aria-label={t("manualSearch.clear")}
            onClick={() => setQuery("")}
            className="grid size-10 shrink-0 place-items-center rounded-full active:bg-subtle"
          >
            <X aria-hidden="true" className="size-5" />
          </Button>
        )}
      </label>
      {!query.trim() && picks.length > 0 && (
        <section className="grid gap-2">
          <h3 className="text-base font-bold text-secondary">
            {t("manualSearch.picksHeading")}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {picks.map(({ doc, page }) => (
              <Button
                key={`${doc.key}-${page}`}
                variant="unstyled"
                size="unstyled"
                type="button"
                onClick={() => setOpen({ doc, page })}
                className="flex w-full flex-col items-start justify-center gap-0.5 rounded-lg border border-black/20 px-4 py-3 text-left whitespace-normal active:bg-subtle"
              >
                <span className="text-lg/tight font-bold">
                  {doc.headings[page]}
                </span>
                <span className="text-sm text-secondary">{doc.title}</span>
              </Button>
            ))}
          </div>
        </section>
      )}
      {shortcuts.length > 0 && (
        <section className="grid gap-2">
          <h3 className="text-base font-bold text-secondary">
            {t("manualSearch.shortcutsHeading")}
          </h3>
          {shortcuts.map((shortcut) => (
            <Button
              key={shortcut.key}
              variant="unstyled"
              size="unstyled"
              type="button"
              onClick={() => {
                onLeave()
                void navigate(shortcut.to)
              }}
              className="flex w-full items-center gap-4 rounded-lg border-2 border-black/20 bg-default px-4 py-3 text-left whitespace-normal active:bg-subtle"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-md bg-subtle">
                <ArrowUpDown aria-hidden="true" className="size-6" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                <span className="text-xl/tight font-bold">
                  {t(`manualSearch.shortcut.${shortcut.key}.title`)}
                </span>
                <span className="text-base text-secondary">
                  {t(`manualSearch.shortcut.${shortcut.key}.hint`)}
                </span>
              </span>
              <ChevronRight
                aria-hidden="true"
                className="size-6 shrink-0 text-secondary"
              />
            </Button>
          ))}
          <h3 className="mt-2 text-base font-bold text-secondary">
            {t("manualSearch.pagesHeading")}
          </h3>
        </section>
      )}
      {query.trim() && docs && (
        <div className="grid max-h-[55svh] gap-2 overflow-y-auto">
          {hits.length === 0 ? (
            <div className="grid gap-3 rounded-lg bg-subtle p-5">
              <p className="text-xl font-bold">
                {t("manualSearch.noHits", { query: query.trim() })}
              </p>
              <a
                href={`tel:${OPERATIONS_CENTER_PHONE}`}
                className="flex items-center gap-2 text-lg font-bold"
              >
                <Phone aria-hidden="true" className="size-5" />
                {t("manualSearch.callCenter", {
                  phone: OPERATIONS_CENTER_PHONE,
                })}
              </a>
            </div>
          ) : (
            hits.map((hit) => (
              <Button
                key={`${hit.doc.key}-${hit.page}`}
                variant="unstyled"
                size="unstyled"
                type="button"
                onClick={() => setOpen({ doc: hit.doc, page: hit.page })}
                className="flex w-full flex-col items-start gap-1 rounded-lg border border-black/20 px-4 py-3 text-left whitespace-normal active:bg-subtle"
              >
                <span className="text-xl/tight font-bold">
                  {hit.doc.headings[hit.page] || hit.doc.title}
                </span>
                <span className="line-clamp-2 text-base/snug text-secondary">
                  <Highlighted {...hit.snippet} />
                </span>
                <span className="text-sm font-medium text-secondary">
                  {hit.doc.title}・
                  {t("manualSearch.page", { page: hit.page + 1 })}
                </span>
              </Button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function Highlighted({
  text,
  marks,
}: {
  text: string
  marks: [number, number][]
}) {
  const parts: React.ReactNode[] = []
  let at = 0
  marks.forEach(([from, to], index) => {
    if (from < at) return
    parts.push(text.slice(at, from))
    parts.push(
      <mark key={index} className="rounded-sm bg-primary-subtle font-bold">
        {text.slice(from, to)}
      </mark>
    )
    at = to
  })
  parts.push(text.slice(at))
  return <>{parts}</>
}
