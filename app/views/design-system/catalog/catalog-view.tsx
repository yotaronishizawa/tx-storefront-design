import {
  ButtonDoc,
  ChoiceCardDoc,
  NoticeDoc,
  SupportContactDoc,
} from "./components/component-docs"
import { DocSection } from "./components/doc-parts"
import { Foundations } from "./components/foundations"

const NAV = [
  {
    title: "Start here",
    items: [{ id: "how-to-use", label: "How to use this" }],
  },
  {
    title: "Foundations",
    items: [
      { id: "colour", label: "Colour" },
      { id: "type", label: "Type" },
      { id: "shape", label: "Shape, outline, depth" },
      { id: "spacing", label: "Spacing" },
    ],
  },
  {
    title: "Components",
    items: [
      { id: "button", label: "Button" },
      { id: "choice-card", label: "ChoiceCard" },
      { id: "notice", label: "Notice" },
      { id: "support-contact", label: "SupportContact" },
    ],
  },
  {
    title: "Next",
    items: [{ id: "coming-next", label: "Coming next" }],
  },
]

/** Pieces found in the inventory that are still built several ways. */
const COMING_NEXT = [
  {
    name: "Dialog templates",
    what: "Alert, waiting, and panel dialogs with one footer order and size",
  },
  {
    name: "IconButton",
    what: "Round and square icon-only buttons in three sizes",
  },
  { name: "PillButton", what: "The header's rounded buttons" },
  {
    name: "StatusPill / Badge",
    what: "Robot status, in progress, unsent changes",
  },
  {
    name: "SectionHeading / PageHeader",
    what: "Titles with the yellow bar, and page headers",
  },
  {
    name: "SegmentedControl / NavList",
    what: "Tabs, toggles and side navigation",
  },
  { name: "SearchField", what: "One search box" },
  { name: "EmptyState / Loading", what: "Nothing here yet, and waiting" },
  {
    name: "StepList / Figure",
    what: "Numbered steps, and pictures with a caption",
  },
]

/**
 * StoreApp v2's design system, on one page: the tokens and the components to
 * build screens from, each with when to use it, live examples and its props.
 * Open at /design-system; no sign-in needed.
 */
export function CatalogView() {
  return (
    <div className="grid h-svh grid-cols-[16rem_minmax(0,1fr)] bg-subtle text-primary">
      <nav className="flex flex-col gap-6 overflow-y-auto border-e border-default bg-default p-6">
        <div className="flex flex-col gap-1">
          <p className="text-xl font-bold">StoreApp v2</p>
          <p className="text-base text-secondary">Design system</p>
        </div>
        {NAV.map((group) => (
          <div key={group.title} className="flex flex-col gap-1">
            <p className="px-3 text-sm font-bold text-secondary">
              {group.title}
            </p>
            {group.items.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="rounded-md px-3 py-2 text-base active:bg-subtle"
              >
                {item.label}
              </a>
            ))}
          </div>
        ))}
      </nav>

      <main className="overflow-y-auto">
        <div className="mx-auto flex max-w-6xl flex-col gap-20 px-10 py-12">
          <DocSection
            id="how-to-use"
            title="How to use this"
            lead="Every screen of StoreApp v2 is built from the pieces on this page. Simple screens can be designed and built from here without a designer; the point is that the app keeps one look and one way of working, not a patchwork of near-copies."
          >
            <ol className="grid grid-cols-3 gap-4">
              {[
                {
                  title: "Look here first",
                  body: "Before drawing or coding anything, find the piece whose 'Use it when' matches what you need.",
                },
                {
                  title: "Use it as it is",
                  body: "Pick a variant; don't restyle it with your own classes. A near-copy is how two looks for one job start.",
                },
                {
                  title: "Nothing fits? Ask",
                  body: "Talk to design before building a new piece. Once agreed, it is added here so the next person finds it.",
                },
              ].map((step, index) => (
                <li
                  key={step.title}
                  className="flex flex-col gap-2 rounded-lg bg-default p-5"
                >
                  <span className="grid size-8 place-items-center rounded-full bg-inverse text-base font-bold text-inverse">
                    {index + 1}
                  </span>
                  <span className="text-lg font-bold">{step.title}</span>
                  <span className="text-base text-secondary">{step.body}</span>
                </li>
              ))}
            </ol>
          </DocSection>

          <Foundations />

          <ButtonDoc />
          <ChoiceCardDoc />
          <NoticeDoc />
          <SupportContactDoc />

          <DocSection
            id="coming-next"
            title="Coming next"
            lead="Still built several ways in the app today (see docs/design-system/inventory.md). Until they land here, copy the closest existing use and tell design."
          >
            <div className="grid grid-cols-3 gap-3">
              {COMING_NEXT.map((item) => (
                <div
                  key={item.name}
                  className="flex flex-col gap-1 rounded-lg border border-dashed border-strong bg-default p-4"
                >
                  <span className="font-bold">{item.name}</span>
                  <span className="text-sm text-secondary">{item.what}</span>
                </div>
              ))}
            </div>
          </DocSection>
        </div>
      </main>
    </div>
  )
}
