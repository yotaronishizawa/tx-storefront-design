import { useEffect, useMemo, useState } from "react"

import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Phone,
  Search,
  X,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { OPERATIONS_CENTER_PHONE } from "~/config/app"
import { Button, Input } from "~/core"
import {
  loadManualIndex,
  MANUAL_PAGE_IMAGE_BASE,
  manualPicksFor,
  searchManual,
  type ManualDoc,
  type ManualPage,
} from "~/utils/manual-search"

const MAX_HITS = 30

/** Where the help is, so "back" returns to where staff came from. */
type View =
  | { kind: "start" }
  | { kind: "library" }
  | { kind: "deck"; doc: ManualDoc }
  | { kind: "page"; at: ManualPage; from: "start" | "deck" }

/** A deck's sections: each slide title once, at its first page (cover and contents left out). */
function sectionsOf(doc: ManualDoc): ManualPage[] {
  const sections: ManualPage[] = []
  doc.headings.forEach((heading, page) => {
    if (page === 0 || !heading || heading === "目次") return
    if (doc.headings[page - 1] === heading) return
    sections.push({ doc, page })
  })
  return sections
}

/**
 * Staff mostly know the app; they open the manual to look one thing up. So
 * the help starts with a search box: type a word, get the manual pages that
 * say it, read the page right here. When the manual has nothing, say so and
 * give the operations centre's number.
 */
export function ManualSearch({
  pathname,
  onSearchingChange,
}: {
  /** The screen behind the help: its likely questions come first. */
  pathname: string
  /** True while a search or a page is on screen (the help hides its buttons). */
  onSearchingChange: (searching: boolean) => void
}) {
  const { t } = useTranslation("app")
  const [docs, setDocs] = useState<ManualDoc[] | null>(null)
  const [query, setQuery] = useState("")
  const [view, setView] = useState<View>({ kind: "start" })
  const open = (at: ManualPage, from: "start" | "deck" = "start") =>
    setView({ kind: "page", at, from })

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
  const picks = useMemo(
    () => (docs ? manualPicksFor(docs, pathname) : []),
    [docs, pathname]
  )
  const searching = query.trim().length > 0 || view.kind !== "start"
  useEffect(() => onSearchingChange(searching), [onSearchingChange, searching])

  const backButton = (onClick: () => void, label: string) => (
    <Button
      variant="unstyled"
      size="unstyled"
      type="button"
      onClick={onClick}
      className="flex min-h-11 items-center gap-1 justify-self-start rounded-full ps-2 pe-4 text-lg font-bold active:bg-subtle"
    >
      <ChevronLeft aria-hidden="true" className="size-6" />
      {label}
    </Button>
  )

  if (view.kind === "page") {
    const { doc, page } = view.at
    const goTo = (next: number) => setView({ ...view, at: { doc, page: next } })
    return (
      <div className="grid gap-4">
        {view.from === "deck"
          ? backButton(
              () => setView({ kind: "deck", doc }),
              t("manualSearch.backToDeck", { title: doc.title })
            )
          : backButton(
              () => setView({ kind: "start" }),
              t("manualSearch.back")
            )}
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
            onClick={() => goTo(page - 1)}
          >
            <ChevronLeft aria-hidden="true" className="size-6" />
            {t("manualSearch.previous")}
          </Button>
          <Button
            variant="secondary"
            className="h-14 gap-2 px-6 text-lg"
            disabled={page === doc.pages.length - 1}
            onClick={() => goTo(page + 1)}
          >
            {t("manualSearch.next")}
            <ChevronRight aria-hidden="true" className="size-6" />
          </Button>
        </div>
      </div>
    )
  }

  if (view.kind === "deck") {
    const { doc } = view
    return (
      <div className="grid gap-4">
        {backButton(
          () => setView({ kind: "library" }),
          t("manualSearch.backToLibrary")
        )}
        <p className="text-display/tight font-bold">{doc.title}</p>
        <div className="grid max-h-[60svh] gap-2 overflow-y-auto">
          {sectionsOf(doc).map(({ page }) => (
            <Button
              key={page}
              variant="unstyled"
              size="unstyled"
              type="button"
              onClick={() => open({ doc, page }, "deck")}
              className="flex w-full items-center gap-3 rounded-lg border border-black/20 px-4 py-3 text-left whitespace-normal active:bg-subtle"
            >
              <span className="flex-1 text-lg/tight font-bold">
                {doc.headings[page]}
              </span>
              <span className="text-sm text-secondary">
                {t("manualSearch.page", { page: page + 1 })}
              </span>
              <ChevronRight
                aria-hidden="true"
                className="size-5 shrink-0 text-secondary"
              />
            </Button>
          ))}
        </div>
      </div>
    )
  }

  if (view.kind === "library") {
    return (
      <div className="grid gap-4">
        {backButton(
          () => setView({ kind: "start" }),
          t("manualSearch.backToStart")
        )}
        <p className="text-display/tight font-bold">
          {t("manualSearch.library")}
        </p>
        <div className="grid max-h-[60svh] grid-cols-2 gap-2 overflow-y-auto">
          {(docs ?? []).map((doc) => (
            <Button
              key={doc.key}
              variant="unstyled"
              size="unstyled"
              type="button"
              onClick={() => setView({ kind: "deck", doc })}
              className="flex w-full items-center gap-3 rounded-lg border border-black/20 px-4 py-3 text-left whitespace-normal active:bg-subtle"
            >
              <BookOpen
                aria-hidden="true"
                className="size-5 shrink-0 text-secondary"
              />
              <span className="flex-1 text-lg/tight font-bold">
                {doc.title}
              </span>
              <span className="text-sm text-secondary">
                {t("manualSearch.pageCount", { count: doc.pages.length })}
              </span>
            </Button>
          ))}
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
                onClick={() => open({ doc, page })}
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
      {!query.trim() && docs && docs.length > 0 && (
        <Button
          variant="secondary"
          className="min-h-16 justify-start gap-4 text-lg"
          onClick={() => setView({ kind: "library" })}
        >
          <BookOpen aria-hidden="true" className="size-6" />
          {t("manualSearch.openLibrary")}
        </Button>
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
                onClick={() => open({ doc: hit.doc, page: hit.page })}
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
