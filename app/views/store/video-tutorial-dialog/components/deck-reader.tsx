import { ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "~/core"
import { cn } from "~/utils/cn"
import {
  MANUAL_PAGE_IMAGE_BASE,
  sectionsOf,
  type ManualDoc,
} from "~/utils/manual-search"

/**
 * One manual document: its sections on the left, the page on the right. The
 * buttons under the page name where they go, not just "next".
 */
export function DeckReader({
  doc,
  page,
  onPage,
  onBack,
  backLabel,
}: {
  doc: ManualDoc
  page: number
  onPage: (page: number) => void
  onBack: () => void
  backLabel: string
}) {
  const { t } = useTranslation("app")
  const sections = sectionsOf(doc)
  // The section the page belongs to: the last one starting at or before it.
  const current = sections.filter((section) => section.page <= page).at(-1)
  const previous = page > 0 ? page - 1 : null
  const next = page < doc.pages.length - 1 ? page + 1 : null
  // Name the page a button goes to, unless it carries on the same section.
  const nameOf = (target: number, fallback: string) => {
    const heading = doc.headings[target]
    return heading && heading !== doc.headings[page] ? heading : fallback
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-[16rem_minmax(0,1fr)]">
      <nav className="flex min-h-0 flex-col gap-1 overflow-y-auto border-e p-3">
        <Button
          variant="unstyled"
          size="unstyled"
          type="button"
          onClick={onBack}
          className="mb-2 flex min-h-11 items-center gap-1 self-start rounded-md ps-1 pe-3 text-base font-bold text-secondary active:bg-subtle"
        >
          <ChevronLeft aria-hidden="true" className="size-5" />
          {backLabel}
        </Button>
        <p className="px-3 pb-2 text-lg/tight font-bold">{doc.title}</p>
        {sections.map((section) => (
          <Button
            key={section.page}
            variant="unstyled"
            size="unstyled"
            type="button"
            onClick={() => onPage(section.page)}
            className={cn(
              "flex min-h-11 justify-start rounded-md px-3 py-2 text-left text-base/tight whitespace-normal",
              section.page === current?.page
                ? "bg-primary-subtle font-bold text-primary-text"
                : "text-primary active:bg-subtle"
            )}
          >
            {doc.headings[section.page]}
          </Button>
        ))}
      </nav>
      <section className="flex min-h-0 flex-col gap-4 overflow-y-auto p-6">
        <p className="text-xl/tight font-bold">
          {doc.headings[page] || doc.title}
          <span className="ms-3 text-base font-medium text-secondary">
            {t("manualSearch.pageOf", {
              page: page + 1,
              total: doc.pages.length,
            })}
          </span>
        </p>
        <img
          src={MANUAL_PAGE_IMAGE_BASE + doc.images[page]}
          alt={doc.pages[page]}
          className="w-full rounded-lg object-contain ring-1 ring-black/10"
        />
        <div className="flex justify-between gap-3">
          {previous !== null ? (
            <Button
              variant="secondary"
              className="h-14 max-w-[48%] gap-2 px-5 text-base"
              onClick={() => onPage(previous)}
            >
              <ChevronLeft aria-hidden="true" className="size-5 shrink-0" />
              <span className="truncate">
                {nameOf(previous, t("manualSearch.previous"))}
              </span>
            </Button>
          ) : (
            <span />
          )}
          {next !== null && (
            <Button
              variant="secondary"
              className="h-14 max-w-[48%] gap-2 px-5 text-base"
              onClick={() => onPage(next)}
            >
              <span className="truncate">
                {nameOf(next, t("manualSearch.next"))}
              </span>
              <ChevronRight aria-hidden="true" className="size-5 shrink-0" />
            </Button>
          )}
        </div>
      </section>
    </div>
  )
}
