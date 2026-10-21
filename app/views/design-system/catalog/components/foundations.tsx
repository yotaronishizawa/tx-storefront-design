import { useEffect, useRef, useState } from "react"

import { cn } from "~/utils/cn"

import { DocSection, SubTitle, UseWhen } from "./doc-parts"

type Swatch = { name: string; className: string; use: string }

// Class names are written out in full so Tailwind generates them.
const COLOUR_GROUPS: { title: string; swatches: Swatch[] }[] = [
  {
    title: "Surfaces",
    swatches: [
      {
        name: "bg-default",
        className: "bg-default",
        use: "Cards, dialogs, the page",
      },
      {
        name: "bg-subtle",
        className: "bg-subtle",
        use: "Grouped areas, icon squares, pressed cards",
      },
      {
        name: "bg-muted",
        className: "bg-muted",
        use: "Disabled controls, quiet fills",
      },
      {
        name: "bg-inverse",
        className: "bg-inverse",
        use: "Camera and video frames, number badges",
      },
      { name: "bg-overlay", className: "bg-overlay", use: "Behind a dialog" },
    ],
  },
  {
    title: "Text",
    swatches: [
      {
        name: "text-primary",
        className: "bg-(--text-color-primary)",
        use: "All body text and titles",
      },
      {
        name: "text-secondary",
        className: "bg-(--text-color-secondary)",
        use: "Supporting lines, captions",
      },
      {
        name: "text-disabled",
        className: "bg-(--text-color-disabled)",
        use: "Disabled labels only",
      },
      {
        name: "text-on-primary",
        className: "bg-(--text-color-on-primary)",
        use: "Text on a yellow button",
      },
    ],
  },
  {
    title: "Brand and states",
    swatches: [
      {
        name: "primary",
        className: "bg-primary",
        use: "The one main action on a screen",
      },
      {
        name: "primary-subtle",
        className: "bg-primary-subtle",
        use: "Selected item, highlighted box",
      },
      {
        name: "error",
        className: "bg-error",
        use: "Something is wrong; the robot cannot move",
      },
      {
        name: "error-subtle",
        className: "bg-error-subtle",
        use: "Behind an error notice",
      },
      {
        name: "warning",
        className: "bg-warning",
        use: "Careful: may cause trouble",
      },
      {
        name: "warning-subtle",
        className: "bg-warning-subtle",
        use: "Behind a warning notice",
      },
      {
        name: "success",
        className: "bg-success",
        use: "Done, fixed, running fine",
      },
      {
        name: "success-subtle",
        className: "bg-success-subtle",
        use: "Behind a success notice",
      },
      {
        name: "info",
        className: "bg-info",
        use: "Information, the support phone number",
      },
      {
        name: "info-subtle",
        className: "bg-info-subtle",
        use: "Behind an info notice or support card",
      },
    ],
  },
  {
    title: "Lines",
    swatches: [
      {
        name: "border-default",
        className: "bg-(--border-color-default)",
        use: "Dividers, quiet frames",
      },
      {
        name: "border-control",
        className: "bg-(--border-color-control)",
        use: "Outline of tappable cards and inputs (2px)",
      },
      {
        name: "border-strong",
        className: "bg-(--border-color-strong)",
        use: "Secondary buttons, focused inputs",
      },
    ],
  },
]

const TYPE_SCALE = [
  {
    name: "text-display-xl",
    className: "text-display-xl",
    use: "Idle screen only",
  },
  {
    name: "text-display-lg",
    className: "text-display-lg",
    use: "Very large numbers",
  },
  {
    name: "text-display",
    className: "text-display",
    use: "Screen and dialog titles that must read from afar",
  },
  {
    name: "text-xl",
    className: "text-xl",
    use: "Card titles, attention titles, main labels",
  },
  {
    name: "text-lg",
    className: "text-lg",
    use: "Body text on a screen, list titles, buttons",
  },
  {
    name: "text-base",
    className: "text-base",
    use: "Supporting text, notices, captions",
  },
  {
    name: "text-sm",
    className: "text-sm",
    use: "Meta lines (page numbers, timestamps)",
  },
  {
    name: "text-xs",
    className: "text-xs",
    use: "Dense data only (shelf cells); avoid elsewhere",
  },
]

const RADII = [
  { name: "rounded-sm", className: "rounded-sm", use: "Tiny badges" },
  {
    name: "rounded-md",
    className: "rounded-md",
    use: "Buttons, notices, icon squares",
  },
  {
    name: "rounded-lg",
    className: "rounded-lg",
    use: "Cards, frames, support card",
  },
  { name: "rounded-xl", className: "rounded-xl", use: "Dialogs, big panels" },
  {
    name: "rounded-full",
    className: "rounded-full",
    use: "Pills, round icon buttons",
  },
]

const SPACING = [
  {
    gap: "gap-2 · 8px",
    use: "Inside one element: icon to label, heading to its card",
  },
  {
    gap: "gap-4 · 16px",
    use: "Between items of one group; a label above a picture",
  },
  { gap: "gap-6 · 24px", use: "Between sections on a screen or in a dialog" },
  {
    gap: "gap-12 · 48px",
    use: "Before the main action, after the support line",
  },
]

export function Foundations() {
  return (
    <>
      <DocSection
        id="colour"
        title="Colour"
        lead="Colours are named by what the element is, not how it looks. Use only these; lint rejects hex values and Tailwind's palette."
      >
        {COLOUR_GROUPS.map((group) => (
          <div key={group.title} className="flex flex-col gap-3">
            <SubTitle>{group.title}</SubTitle>
            <div className="grid grid-cols-3 gap-3 xl:grid-cols-5">
              {group.swatches.map((swatch) => (
                <ColourSwatch key={swatch.name} swatch={swatch} />
              ))}
            </div>
          </div>
        ))}
        <UseWhen
          dos={[
            "Red only when the robot cannot move or something failed",
            "Yellow (primary) for the single main action on a screen",
            "Tinted backgrounds (-subtle) with near-black text on top",
          ]}
          donts={[
            "Coloured text for whole sentences: the icon carries the colour",
            "Black or white with opacity (bg-black/5): pick a token",
            "A new colour for one screen: ask design to add a token",
          ]}
        />
      </DocSection>

      <DocSection
        id="type"
        title="Type"
        lead="One scale for the whole app. Staff read the tablet at arm's length, often standing: when in doubt, go one size up. Japanese falls back to the system font."
      >
        <div className="flex flex-col divide-y divide-default overflow-hidden rounded-lg border border-default bg-default">
          {TYPE_SCALE.map((step) => (
            <div
              key={step.name}
              className="grid grid-cols-[12rem_minmax(0,1fr)_16rem] items-baseline gap-4 px-5 py-4"
            >
              <span className="font-mono text-sm text-secondary">
                {step.name}
              </span>
              <span className={cn(step.className, "truncate font-bold")}>
                在庫棚にいれる Restock
              </span>
              <span className="text-sm text-secondary">{step.use}</span>
            </div>
          ))}
        </div>
        <p className="text-base text-secondary">
          Weights: <b>bold</b> for titles, labels and anything tappable; regular
          for sentences and captions. Medium is rarely needed.
        </p>
      </DocSection>

      <DocSection
        id="shape"
        title="Shape, outline and depth"
        lead="Corners grow with the size of the thing. Anything tappable that is not a Button has the same 2px border-control outline, so tappable reads the same everywhere."
      >
        <div className="flex flex-wrap gap-4">
          {RADII.map((radius) => (
            <div key={radius.name} className="flex w-44 flex-col gap-2">
              <div
                className={cn(
                  "h-20 border-2 border-control bg-default",
                  radius.className
                )}
              />
              <span className="font-mono text-sm">{radius.name}</span>
              <span className="text-sm text-secondary">{radius.use}</span>
            </div>
          ))}
          <div className="flex w-44 flex-col gap-2">
            <div className="h-20 rounded-xl bg-default shadow-dialog" />
            <span className="font-mono text-sm">shadow-dialog</span>
            <span className="text-sm text-secondary">
              The only shadow: dialogs and floating panels
            </span>
          </div>
        </div>
      </DocSection>

      <DocSection
        id="spacing"
        title="Spacing"
        lead="Tailwind's 4px scale. Four steps cover almost everything; the same rhythm on every screen makes groups readable without lines."
      >
        <div className="flex flex-col gap-3">
          {SPACING.map((step) => (
            <div key={step.gap} className="flex items-center gap-4">
              <span className="w-32 font-mono text-sm">{step.gap}</span>
              <span
                className="h-6 rounded-sm bg-primary"
                style={{ width: step.gap.split("· ")[1] }}
              />
              <span className="text-base text-secondary">{step.use}</span>
            </div>
          ))}
        </div>
        <p className="text-base text-secondary">
          Tap targets are at least 44px high (min-h-11); main choices are 96px
          (min-h-24) so a gloved or hurried hand still hits them.
        </p>
      </DocSection>
    </>
  )
}

/** Shows the token's real value, read from the page, so it never drifts. */
function ColourSwatch({ swatch }: { swatch: Swatch }) {
  const ref = useRef<HTMLDivElement>(null)
  const [value, setValue] = useState("")
  useEffect(() => {
    if (ref.current)
      setValue(toHex(getComputedStyle(ref.current).backgroundColor))
  }, [])
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-default bg-default">
      <div ref={ref} className={cn("h-16", swatch.className)} />
      <div className="flex flex-col gap-0.5 p-3">
        <span className="font-mono text-sm font-bold">{swatch.name}</span>
        <span className="font-mono text-xs text-secondary">{value}</span>
        <span className="text-sm text-secondary">{swatch.use}</span>
      </div>
    </div>
  )
}

/** `rgb(245, 192, 0)` → `#f5c000`; a colour with alpha keeps its percentage. */
function toHex(colour: string) {
  const parts = colour.match(/[\d.]+/g)?.map(Number) ?? []
  if (parts.length < 3) return colour
  const hex = `#${parts
    .slice(0, 3)
    .map((part) => Math.round(part).toString(16).padStart(2, "0"))
    .join("")}`
  return parts.length === 4 && parts[3] < 1
    ? `${hex} · ${Math.round(parts[3] * 100)}%`
    : hex
}
