# Design tokens

The catalog with live examples of tokens and components is at `/design-system` in the running app (StoreApp v2).

Source: Figma [Store App (Web) Styles](https://www.figma.com/design/zBjgYmQ91cOXOaytUP6km7/Store-App--Web-?node-id=9-2)
(draft, updated 2026-10-04). Colours are not final.

The tokens live in the Tailwind theme in `app/app.css`. Use them through Tailwind
classes. Don't use raw palette classes (`slate-*`, `amber-*`), hex values, or
arbitrary colours, sizes or radii. The theme resets Tailwind's default colours,
shadows, radii and font sizes, so lint fails on anything else.

## Names

A Figma path becomes a utility: `bg/X` → `bg-X`, `text/X` → `text-X`,
`border/X` → `border-X`, `<role>/default` → `*-<role>`, `<role>/<leaf>` →
`*-<role>-<leaf>`.

| Figma             | Class                                          |
| ----------------- | ---------------------------------------------- |
| `bg/subtle`       | `bg-subtle`                                    |
| `text/secondary`  | `text-secondary`                               |
| `primary/default` | `bg-primary`, `border-primary`, `ring-primary` |
| `primary/text`    | `text-primary-text`                            |

**Watch out:** `text-primary` is near-black (`text/primary`), not yellow. Yellow
text is `text-primary-text`.

## Colour

| Token           | Class               | Use                                                            |
| --------------- | ------------------- | -------------------------------------------------------------- |
| bg/default      | `bg-default`        | Page, card and modal background                                |
| bg/subtle       | `bg-subtle`         | Section background, grouped areas                              |
| bg/muted        | `bg-muted`          | Disabled controls, chip background, pressed row                |
| bg/inverse      | `bg-inverse`        | Toast and dark banner background                               |
| bg/overlay      | `bg-overlay`        | Scrim behind dialogs and panels                                |
| text/primary    | `text-primary`      | Main text and icons                                            |
| text/secondary  | `text-secondary`    | Secondary text, captions, inactive icons                       |
| text/disabled   | `text-disabled`     | Disabled text and icons                                        |
| text/inverse    | `text-inverse`      | Text on dark, error or success backgrounds                     |
| text/on-primary | `text-on-primary`   | Text and icons on `bg-primary`                                 |
| border/default  | `border-default`    | Dividers, card and list borders (the default border colour)    |
| border/strong   | `border-strong`     | Inputs and controls that need a visible edge                   |
| (app) control   | `border-control`    | 2px outline of anything tappable that is not a Button (cards, tiles, list rows, search box). v2 only, not in Figma |
| primary/default | `*-primary`         | Main buttons, selected state, active tab                       |
| primary/pressed | `*-primary-pressed` | Primary button while pressed                                   |
| primary/subtle  | `bg-primary-subtle` | Selected row or card background                                |
| primary/text    | `text-primary-text` | Primary-coloured text and icons on white                       |
| error/default   | `*-error`           | Error text, icons, borders, destructive button                 |
| error/pressed   | `*-error-pressed`   | Destructive button while pressed                               |
| error/subtle    | `bg-error-subtle`   | Error message background                                       |
| warning/default | `*-warning`         | Warning icons, borders, large text                             |
| warning/subtle  | `bg-warning-subtle` | Warning message background; small text on it is `text-primary` |
| success/default | `*-success`         | Success text, icons, borders                                   |
| success/subtle  | `bg-success-subtle` | Success message background                                     |
| info/default    | `*-info`            | Info text, icons, links                                        |
| info/subtle     | `bg-info-subtle`    | Info message background                                        |

`bg-*`, `text-*` and `border-*` names only work on their own utility. `bg-subtle`
exists, but `text-subtle` does not. The role colours (`primary`, `error`…) work
on every colour utility.

`white` and `black` stay available for non-UI drawing (the QR code).

## Type

Inter. Japanese uses the system font until design picks one. Line heights are
still Tailwind's defaults until design decides them.

| Class       | Size | Use                                                       |
| ----------- | ---- | --------------------------------------------------------- |
| `text-xl`   | 24px | Modal title, page and section titles, home tiles          |
| `text-lg`   | 20px | Modal body, buttons, panel and drawer titles              |
| `text-base` | 18px | Default. Body text, main values, tabs, error instructions |
| `text-sm`   | 16px | Row labels, secondary info                                |
| `text-xs`   | 14px | Small labels, dates, codes, product names, chips          |

Weights are `font-normal` (400), `font-medium` (500) and `font-bold` (700) only.

## Spacing, radius, border, shadow

- **Spacing:** padding, margin and gap use only 1, 2, 3, 4, 5, 6, 8, 10 and 12
  (4px steps; `p-4` = 16px). Widths and heights may use any step. Dense
  lane and table cells may keep half steps (`0.5`, `1.5`) where 4px would break
  the layout.
- **Radius:** `rounded-sm` (4px) for chips, tags and badges. `rounded-md` (8px)
  for buttons, inputs and list items. `rounded-lg` (12px) for cards and list
  groups. `rounded-xl` (16px) for modals and panels. `rounded-full` for pills and
  round badges.
- **Border:** `border` (1px) for borders and dividers. `border-2` for focus,
  selected or emphasised borders. Selected is `border-2 border-primary
bg-primary-subtle`.
- **Shadow:** `shadow-dialog` for dialogs, drawers, popups and toasts only.
  Cards use a border.
- **Screen:** iPad, 1180×820 CSS px. Figma is drawn at 1x, so its values match
  the code.

## App-local tokens (pending design)

Figma has no token for these. They live in the second `@theme` block in
`app/app.css`. Ask design before adding to the list.

- `text-display` (36px), `text-display-lg` (48px) and `text-display-xl` (72px):
  large numbers and illustrations.
- `--container-dialog*`: dialog widths.

Restocking lane states use the Figma colours: can place `success`, cannot place
`bg-muted`, error `error`, warning `warning`, selected `ring-primary`, last added
`ring-info`, unused `bg-inverse/70`.

## Changing a token

1. Edit `app/app.css`, then this file, and update the Figma date at the top.
2. Never name a colour `xs`, `sm`, `base`, `lg` or `xl`: in `text-*` a
   colour wins over a font size.
3. If a new font size or shadow name isn't a t-shirt size, add it to the
   tailwind-merge config in `app/utils/cn.ts`, or `cn()` will merge it wrongly.

## User-study home (2026-10-06)

The explicitly supplied Store App node `7863:163508` uses warm cream for RS and
pale green for MR. `bg-home-restock` (#f7eed9) and `bg-home-manual` (#e1f7d9)
retain those exact backgrounds in the study home and the corresponding task cards.
These are source-specific study tokens, not a change to shared primary/success roles.
