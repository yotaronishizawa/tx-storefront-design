# UI inventory for the design system: tx-storefront-design

All paths are relative to the repository root. Taken on 2026-10-21 (commit 75d76d5); line numbers drift as the code changes. Line numbers are 1-based. "core" means a primitive from `app/core`. "hand" means hand-written Tailwind, usually `<Button variant="unstyled" size="unstyled">`.

**Work in progress:** `app/views/store/work-report/work-report-view.tsx` and `app/routes/work-report/route.tsx` are untracked. The file says it is a wireframe, with hard-coded Japanese copy and sample data. It is listed below but marked WIP.

**Dead code (designers should not pick these):**
- `app/views/store/home-dashboard/components/` `home-action-tile.tsx`, `home-mini-button.tsx`, `home-section-title.tsx`, `home-status-card.tsx`, `walk-in-traffic-light.tsx`
- `app/components/button/top-button.tsx`
- None of these is rendered anywhere.

---

## 0. Foundations

### Tokens in `app/app.css`
Tailwind's own colours, shadows, text sizes, radii and font weights are all reset. Spacing is **not** reset, so the default 0.25rem scale still applies.

**Colours:**
- `white` #fff, `black` #000
- Backgrounds:
  - `bg-app` #d9d9d9, `bg-default` #fff, `bg-subtle` #f5f5f5
  - `bg-muted` #e5e5e5, `bg-inverse` #262626, `bg-overlay` rgb(0 0 0 / 30%)
- Text:
  - `text-primary` #171717, `text-secondary` #525252, `text-disabled` #a3a3a3
  - `text-inverse` #fff, `text-on-primary` #3d2f00
- Borders: `border-default` #e5e5e5 (the base default for `*`), `border-strong` #737373
- Primary: `primary` #f5c000, `primary-pressed` #d9aa00, `primary-subtle` #fff9e0, `primary-text` #8f7000
- Error: `error` #da352f, `error-pressed` #b92b26, `error-subtle` #fdecea
- Warning: `warning` #ea580c, `warning-subtle` #fff7ed
- Success: `success` #15803d, `success-subtle` #dcfce7
- Info: `info` #0a66c2, `info-subtle` #eef4ff
- App-local:
  - `bg-home-restock` #f7eed9, `bg-home-manual` #e1f7d9
  - `ring-home-restock` #f5c000, `ring-home-manual` #62ce3b

**Text sizes (size / line-height):**
- `xs` 14/20, `sm` 16/24, `base` 18/28, `lg` 20/28, `xl` 24/32
- App-local: `display` 36/40, `display-lg` 48/1, `display-xl` 72/1

**Other tokens:**
- Font weights: normal 400, medium 500, bold 700
- Font family: Inter Variable, then Hiragino / Noto Sans JP fallbacks
- Radii: `sm` 4px, `md` 8px, `lg` 12px, `xl` 16px (`rounded-full` still exists)
- Shadow: only `shadow-dialog` (0 8px 32px rgb(0 0 0 / 16%))
- Containers: `dialog-sm` 30rem, `dialog` 39.375rem, `dialog-lg` 47.5rem, `dialog-xl` 58.75rem
- Animation classes: `.view-transition`, `.lane-flash`, `.attention-blink` (its keyframe hard-codes `#ec7f7b`, app.css:185), `.idle-wake-ripple`

`docs/design-tokens.md` says arbitrary colours, sizes and radii are not allowed (and claims lint fails on them). The views below still use them.

### Hard-coded values in views instead of tokens

**Colours:**
- `text-[#FF2D20]` — `attention-layout.tsx:146` (the dashed "detected" key)
- `bg-[#fde4d2]` — `walk-in-view.tsx:138` (DontEnterCard; it is not `warning-subtle`)
- `bg-[#cfd4dc]`, `text-[#cfd4dc]`, `bg-[#878787]` — `robot-arm-control.tsx:183`, `:186`, `:197`
- `bg-(--text-color-disabled)` — `home-robot-status.tsx:275` (a text token used as a background)
- Black/white alphas:
  - `bg-black/3` — `home-dashboard-view.tsx:283`
  - `border-black/20` — `home-dashboard-view.tsx:365`, `home-more-actions.tsx:82`, `home-object-action.tsx:94`, `help-parts.tsx:29`, `help-parts.tsx:72`, `video-tutorial-dialog.tsx:149`, `video-tutorial-dialog.tsx:450`
  - `border-black/30` — `home-more-actions.tsx:40`
  - `border-black/10` — `home-idle-screen.tsx:37`
  - `ring-black/10` — `home-estop-dialog.tsx:80`, `deck-reader.tsx:86`
  - `ring-white` — `cabinet-tab-label.tsx:41`, `:49`, `stock-lane.tsx:122`

**Text sizes:**
- `text-[2rem]` — `home-object-action.tsx:186`, `walk-in-view.tsx:63`
- `text-[3rem]/none` — `home-idle-screen.tsx:37` (same size as `display-lg`)
- `text-[4.875rem]` — `home-robot-status.tsx:296`
- `text-[1.625rem]` — `home-robot-status.tsx:330`
- `text-[1.875rem]` — `robot-arm-panel.tsx:29`
- `text-[10px]` — `work-report-view.tsx:224` (WIP)
- `text-xs/5` — `cabinet-tab-label.tsx:41`

**Radii:**
- `rounded-[1.25rem]` — `choice-dialog.tsx:31`
- `rounded-[11px/7px]` — `robot-arm-control.tsx:197`

**Dialog widths that bypass the `dialog-*` containers:**
- `w-160` (40rem) — `home-estop-dialog.tsx:34`
- `w-240` (60rem) — `home-more-actions.tsx:60`
- `w-172` (43rem) — `choice-dialog.tsx:31`
- `max-w-150` (37.5rem) — `robot-power-dialog.tsx:42`
- `max-w-130` (32.5rem) — `scanner-recovery-dialog.tsx:18`
- `max-w-3xl` — restocking-start:49, manual-finish:33, display-reservation-blocked:21
- `max-w-4xl` — manual-replenishment-start:44
- `max-w-5xl` — `language-menu.tsx:40`
- `max-w-306` / `max-h-205` — `video-tutorial-dialog.tsx:138`

**Other one-offs:**
- `w-[3px]`, `h-41.5`, `w-17` — `robot-arm-control.tsx`
- `zoom-[1.4]` — `robot-arm-panel.tsx:34`
- `duration-5000` — `robot-arm-control.tsx:198`, `home-attention-panel.tsx:221`
- `border-3` — `home-idle-screen.tsx:46`
- `border-5` — `rule-photo.tsx:29`
- `ring-6` — `home-object-action.tsx:202`
- Floating panel widths `w-88`, `w-90`, `w-100`

### `app/core/button.tsx` variants and sizes
- Shared base for the non-unstyled variants: `rounded-md font-bold`, focus ring in `primary`, disabled state `bg-muted text-disabled`.
- **Variants:**
  - `primary` (default): `bg-primary text-on-primary`, pressed `bg-primary-pressed`
  - `secondary`: `border border-strong bg-default text-primary`, pressed `bg-muted`
  - `destructive`: `bg-error text-inverse` — **used 0 times**
  - `unstyled`: a different base — `rounded-full`, transparent border, `text-xs font-medium whitespace-nowrap`, `translate-y-px` when pressed, `disabled:opacity-50`, svg size 4
- **Sizes:**
  - `sm`: `min-h-10 px-4 text-base/tight`, svg 4
  - `md` (default): `min-h-12 px-5 text-lg/tight`, svg 5
  - `lg`: `min-h-14 px-6 text-lg/tight`, svg 6
  - `unstyled`: no classes
- Props: `icon`, and `busy` (shows a Loader2 spinner and disables the button).
- Rough usage: `size="sm"` 37 times, `size="lg"` 17 times, `variant="secondary"` 40 times.
- `app/core/close-button.tsx` is the single close (X) look: `size-10 rounded-full border border-strong text-secondary`, svg 5.

---

## 1. Buttons

### 1a. Core primary and secondary buttons, with size drift for the same job
- **Dialog footers:**
  - ConfirmDialog, RestockingEndNext, ManualFinishNext and SameJan use `size="sm"`.
  - The rule dialogs (restocking-start, manual-start, manual-finish) use md.
  - ChoiceDialog uses `lg` plus `h-16 rounded-xl text-lg` (`choice-dialog.tsx:46-58`).
  - HomeEStop uses secondary lg `w-full` (`home-estop-dialog.tsx:114`).
- **Main action on attention panels:** `size="lg" w-full` — `home-attention-panel.tsx:130`, `:152`, `home-detector-panel.tsx:84`, `:93`.
- **Core look overridden through `className`:**
  - `finish-work-dialog.tsx:87`: primary `min-h-16 w-full text-lg`
  - `deck-reader.tsx:90`, `:104`: secondary `h-14 px-5 text-base`
  - `layout-selection-bar.tsx:85`: secondary `w-12 px-0`, used as an icon button
  - `layout-change-review.tsx:112`: secondary sm with `text-error`
- **Primary re-implemented by hand:**
  - `walk-in-view.tsx:105`: unstyled, `size="lg"`, `min-h-20 rounded-xl bg-primary text-xl text-on-primary`. This is the extra-large primary call to action.
  - `app/routes/not-found/route.tsx:13`: a `<Link>` with `h-11 rounded-md bg-primary px-8 text-xs`.
  - WIP: `work-report-view.tsx:141`, a dark call to action: `min-h-14 rounded-xl bg-inverse text-lg text-inverse`.
- **Cancel shown as primary:** `product-search-dialog.tsx:119` uses a primary sm "Cancel".

### 1b. Text links
| Where | Classes |
|---|---|
| `home-attention-panel.tsx:164` ("do something else" / close) | `self-center px-4 py-2 text-sm font-bold text-secondary underline underline-offset-4` |
| `home-dashboard-view.tsx:258` (action in the attention bar) | `shrink-0 underline underline-offset-4`; size and colour come from the bar (`text-sm bold`, error or primary-text); no padding, so a small tap target |

Both are hand-written.

### 1c. Back buttons (two identical copies)
- `video-tutorial-dialog.tsx:327` (BackBar) and `deck-reader.tsx:45`.
- Both: `min-h-11 gap-1 rounded-md ps-1 pe-3 text-base font-bold text-secondary active:bg-subtle` with ChevronLeft size-5.
- deck-reader adds `mb-2 self-start`. Both hand-written.

### 1d. Icon-only buttons (about 12 looks)
| File:line | Purpose | Size / shape / border / background |
|---|---|---|
| `core/close-button.tsx:14` | dialog/drawer X | 40px circle, `border border-strong`, `text-secondary` |
| `components/layout/app-header-status.tsx:41`, `:51` | header QR / power | 44px `rounded-lg` `bg-primary text-on-primary`, svg 6 |
| `views/store/app-header/app-header-view.tsx:173` | settings | 44px circle `bg-subtle`, svg 5 |
| `components/layout/app-status-footer.tsx:60` | footer QR | 32px `rounded-md border` `bg-default`, svg 5 |
| `video-tutorial-dialog.tsx:171` | clear search | 36px circle, no border, `active:bg-subtle` |
| `pwa-install-prompt-view.tsx:120` | dismiss | `rounded-full p-1 text-secondary`, X size-4 |
| `login/components/password-field.tsx:43` | show/hide password | `h-8 w-10 rounded-md`, svg 4 |
| `recommendation-list-row.tsx:70` | delete row | 48px `rounded-md border border-strong`, svg 6 |
| `layout-editor/components/row-lane-buttons.tsx:6` | add/remove lane | 32px `rounded-md border border-strong`, svg 4, `disabled:opacity-50` |
| `change-layout-cell-button.tsx:21` | insert/remove on a cell | 28px circle `border border-strong`, svg 3.5 |
| `layout-selection-bar.tsx:85` | clear selection | core secondary md `w-12 px-0` (the only core-based icon button) |
| `core/toast.tsx:114` | toast close | `rounded-sm`, X size-4 |
| `core/number-field.tsx:6` | stepper −/+ | 64px circle `border border-strong` |
| `robot-power-dialog.tsx:72` | power | 144px circle, `bg-inverse` or `bg-primary` |
| WIP `work-report-view.tsx:320` | previous/next month | 44px circle, `disabled:opacity-30` |

**Inconsistent:** sizes 28/32/36/40/44/48/64; shapes circle vs `rounded-md` vs `rounded-lg`; border none vs `border-default` vs `border-strong`; disabled state is opacity 30, opacity 50, or `text-disabled`.

### 1e. Header pill buttons (`app-header-view.tsx` and others, all hand-written)
| File:line | Classes |
|---|---|
| `app-header-view.tsx:104` work report | `min-h-11 rounded-full border-2 border-strong px-3 sm:px-4 text-sm bold`; active `ring-2 ring-primary` |
| `:122` show idle screen | `min-h-11 rounded-full bg-subtle px-3 sm:px-4 text-sm bold` |
| `:136` how to use (help) | same as show idle, plus `ring-2 ring-primary` when open |
| `:150` drink refund | same but no `sm:px-4` |
| `:68` logo / home | `min-h-11 rounded-lg px-1` |
| `language-menu.tsx:32` language trigger | `h-10 rounded-full border border-primary bg-default px-3 text-xs bold`, svg 3.5 |
| `components/button/header-action-button.tsx:16` (used only on login) | `h-9 rounded-full border bg-default px-5 text-sm/tight bold`, svg 5 |
| `components/button/top-button.tsx:20` (unused) | `h-10 rounded-full border px-3 text-xs`, active `ring-2` |
| `login-view.tsx:94` manual link on login | `h-8 min-w-28 rounded-full border px-5 text-xs bold` |
| `login-view.tsx:46` logo button | has **no onClick** |

**Inconsistent:** heights 32/36/40/44px; border none vs 1px default vs 1px primary vs 2px strong; text xs vs sm.

### 1f. Segmented controls and toggles
| File:line | Built on | Selected / unselected look |
|---|---|---|
| `components/shelf/cabinet-tabs.tsx:43` | ToggleGroup | items `h-12 min-w-32 rounded-md border px-4 text-sm`; track `rounded-lg border-strong/40 bg-muted p-0.5`; selected `border-strong bg-default` |
| `settings-view.tsx:149` idle timeout | ToggleGroup | `h-12 min-w-24 rounded-md text-base`; selected `bg-primary`; unselected `border border-strong` |
| `layout-change-review.tsx:74` before/after | ToggleGroup | `h-12 rounded-md px-5 text-base`; track `bg-subtle p-1`; selected `bg-inverse text-inverse` |
| `layout-shelf-canvas.tsx:30` row chooser | ToggleGroup | `h-11 rounded-md border-2 px-4 text-base`; selected `border-strong bg-default`; unselected `bg-muted` |
| WIP `work-report-view.tsx:333` | hand | track `rounded-full bg-default p-1`; items `min-h-10 rounded-full px-4 text-sm`; selected `bg-inverse` |
| `display-shelf-view.tsx:210` "temporary layout" | core secondary sm | `aria-pressed`, shows a Check icon when on |

There are 4 different "selected" treatments: white with strong border, yellow fill, dark fill, and primary-subtle (the nav lists in §11).

### 1g. "Move the robot arm" (same action, two looks)
- `robot-arm-control.tsx:96-99`: unstyled with `size="lg"`, `min-h-14 rounded-xl bg-warning text-inverse` (an orange filled button).
- `robot-arm-panel.tsx:67-70`: unstyled with `size="lg"`, `min-h-16 rounded-xl border-2 border-default bg-default text-primary` (white outlined).
- Mixing `variant="unstyled"` with `size="lg"` still applies the lg padding and text classes. The same mix appears at `walk-in-view.tsx:106`.

### 1h. Every `variant="unstyled"` call (51 outside core, plus core/close-button)
Grouped by what each one is trying to be:
- **Icon button (14):**
  - app-header-status:38, :48; app-status-footer:57
  - app-header-view:167; video-tutorial-dialog:166
  - recommendation-list-row:65; change-layout-cell-button:84, :99
  - row-lane-buttons:25, :36
  - pwa-install-prompt:117; password-field:40
  - robot-power-dialog:72 (giant); work-report:321 (WIP)
- **Header pill (8):**
  - app-header-view:65 (logo), :100, :118, :132, :147
  - language-menu:28; header-action-button:14; top-button:17 (unused)
- **Choice tile / card (11):**
  - language-menu:68; home-more-actions:35, :74; home-dashboard-view:360 (walk-in entry)
  - home-object-action:86; help-parts:25 (VideoCard), :68 (PageCard); video-tutorial-dialog:446 (DocList)
  - selected-lane-card:39; home-action-tile:28 (unused); home-mini-button:20 (unused)
- **Product tile (2):** product-search-dialog:87, product-picker-overlay:108
- **Nav / list item (2):** video-tutorial-dialog:307 (NavItem), deck-reader:58
- **Back button (2):** video-tutorial-dialog:328, deck-reader:45
- **Text link (2):** home-attention-panel:164, home-dashboard-view:258
- **Large CTA standing in for a missing variant or size (4):**
  - walk-in-view:107 (extra-large primary)
  - robot-arm-control:98 (warning fill), robot-arm-panel:69 (outline lg)
  - work-report:141 (dark, WIP)
- **Segmented / toggle item (2, WIP):** work-report:65 (memo toggle), :347 (segment)
- **Specialised, fine to keep (2):**
  - lane-card:29 (shelf cell)
  - recommendation-table:113 (sortable column header)
- **Login:** login-view:92 (pill, counted under header pill above) and :47 (logo with no handler)

---

## 2. Large tappable choice tiles and cards
| Component (file:line) | Border | Radius | Min-height / padding | Background / pressed | Text | Built on |
|---|---|---|---|---|---|---|
| HomeObjectAction, `home-object-action.tsx:85` | `border-2 border-black/20` | lg | `min-h-64 lg:min-h-56` | `bg-home-restock` / `bg-home-manual`; in-progress `ring-6 ring-inset` pulse | title `text-[2rem]/tight bold` | hand |
| Walk-in entry (HomeEnterWalkInAction), `home-dashboard-view.tsx:359` | `border-2 border-black/20` | lg | `min-h-24 px-4 py-3` | `bg-default`, `active:bg-subtle` | `text-xl/tight bold`; icon box `size-10 rounded-md bg-subtle`; no chevron | hand |
| "その他" entry, `home-more-actions.tsx:34` | **`border` (1px) `border-black/30`** | lg | `mx-3 min-h-24 px-4 py-3` | no bg, `active:bg-subtle` | title `text-xl/tight` + sub `text-base/tight secondary`; icon box `size-10` with **no bg**; ChevronRight | hand |
| "その他" dialog tiles, `home-more-actions.tsx:72` | `border-2 border-black/20` | lg | `min-h-40 p-5`, column layout | `bg-default`, `active:bg-subtle` | `text-xl/tight`; icon box `size-16 rounded-lg bg-subtle` | hand |
| Language tiles, `language-menu.tsx:67` | `border-2 border-default`; selected `border-primary` | lg | `min-h-40 p-6` | selected or pressed `bg-primary-subtle` | `text-display` + `text-sm secondary` | hand |
| VideoCard, `help-parts.tsx:24` | `border border-black/20` | lg | aspect-video thumbnail, then `p-3` | `active:bg-subtle` | `text-lg/tight bold` | hand |
| PageCard, `help-parts.tsx:67` | `border border-black/20` | lg | `px-4 py-3` | `active:bg-subtle` | `text-lg/tight` + meta `text-sm` (BookOpen size-4) | hand |
| DocList row, `video-tutorial-dialog.tsx:444` | `border border-black/20` | lg | `px-4 py-3` | `active:bg-subtle` | BookOpen size-5 + `text-lg/tight` + count `text-sm` | hand |
| FinishWorkDialog "continue", `finish-work-dialog.tsx:61` | core secondary (`border-strong`) | md | `min-h-24 gap-4` | `active:bg-muted` | `text-xl` + hint `text-base medium`; ArrowRight | core plus overrides |
| SelectedLaneCard, `selected-lane-card.tsx:38` | `border-2 border-primary` | lg | `p-3`, centred | `bg-primary-subtle` | `text-lg/tight` | hand |
| Product tile (search), `product-search-dialog.tsx:86` | `border` (default) | **md** | `min-h-44 p-3` | pressed `border-primary bg-primary-subtle` | name `text-xs/snug`, 3 lines | hand |
| Product tile (picker), `product-picker-overlay.tsx:107` | `border` (default) | **lg** | `min-h-45 p-3` | pressed **`bg-muted`** | `text-xs/tight` + volume | hand |
| Unused: HomeActionTile / HomeMiniButton | `border-2 border-default` | md | — | — | — | hand |

Shelf cells are a separate, specialised pattern and fine to keep as they are: `lane-card.tsx` (`rounded-md border-2 p-1`) with `lane-tile.tsx` and `stock-lane.tsx` as state wrappers.

**Where the looks differ:**
- Border: `border-2 black/20`, `border-1 black/30`, `border-1 black/20`, `border-2 default`, `border-1 default`, `border-2 primary`, core `border-strong`.
- Radius: md vs lg.
- Pressed state: `bg-subtle` vs `bg-muted` vs `primary-subtle`.
- Icon box: `size-10` (with or without `bg-subtle`) vs `size-16`.
- The two product tiles do the same job but differ in radius, min-height and pressed colour.

---

## 3. Dialogs, popups and confirmation prompts

### Core pieces (`app/core/dialog.tsx`)
- `Root`: `rounded-xl bg-default shadow-dialog`; layers z-70/75/80.
- `Title`: `text-xl bold`.
- `Message`: `text-center text-lg/relaxed bold`.
- `Content`: `mt-4 rounded-lg bg-subtle p-3`.
- `Footer`: 2-column grid, `gap-4`.
- `Close`: the CloseButton above.
- Related: `Drawer` (right-side panel, `rounded-l-xl`, title with a yellow left bar) and `Popover.Popup` (`rounded-xl shadow`).

### Shared wrappers in `app/components/dialog`
- **ConfirmDialog** (`confirm-dialog.tsx:33`):
  - Panel `min-h-75 max-w-dialog px-8 pt-12 pb-10`. No title; the message is centred and bold.
  - Footer `max-w-dialog-sm` with sm buttons: confirm (primary) on the **left**, cancel on the right. An optional extra button spans both columns.
- **MessageDialog** (`message-dialog.tsx:24`): same padding, `min-h-80`; one primary sm button `mx-auto min-w-28 px-8`.
- **ChoiceDialog** (`choice-dialog.tsx:30`):
  - Panel `w-172 rounded-[1.25rem] p-6 gap-8`.
  - Title `text-xl/snug`, left-aligned; message `text-left text-base/relaxed font-normal`.
  - Buttons lg `h-16 rounded-xl`, columns 1.13fr / 1fr.
- **FinishWorkDialog** (`finish-work-dialog.tsx:28`): `max-w-dialog p-5 sm:p-8`; title row has a secondary md "Cancel" at top right; then a choice card and a `bg-primary-subtle` box holding a primary call to action.

### The app shell's `askOperator` prompts
- Routed by `app/views/store/action-prompt-dialog/action-prompt-dialog.tsx:102-141`, so one shell API produces **three looks**:
  - ChoiceDialog for `stop-and-enter` and `start-and-home`
  - MessageDialog for one-button prompts (optionally with PromptPhotos)
  - ConfirmDialog for two-button prompts
- Callers include `robot-start.ts:78,91`, `robot-stop.ts:48,87,95`, `action-results.ts:169`, `use-robot-actions.ts:48,116`, `routes/home/route.tsx:180`, `routes/walk-in/route.tsx:247` and others.
- The scan alert also goes through MessageDialog (`app/routes/_components/scan-alert-dialog.tsx:69`).

### Dialogs that use `Dialog.Root` but lay themselves out by hand
- **RestockingEndNextDialog** (`restocking-end-next-dialog.tsx:27`) and **ManualFinishNextDialog** (`manual-finish-next-dialog.tsx:26`): byte-for-byte the same layout (`min-h-75 max-w-dialog grid-rows-[auto_1fr_auto] gap-4 px-8 pt-12 pb-10`, centred title, message, footer with sm buttons). This is ConfirmDialog plus a title.
- **ConnectingDialog** (`connecting-dialog.tsx:23`) and **ShelfMovingDialog** (`shelf-moving-dialog.tsx:14`): the same blocking spinner (`max-w-dialog items-center gap-6 px-8 py-12`, Loader2 size-12 `text-primary-text`, message).
- **Rule dialogs:** RestockingStart `:48` (`max-w-3xl`), ManualReplenishmentStart `:43` (`max-w-4xl`), ManualFinish `:32` (`max-w-3xl`). All: `p-5`, centred title, `Content` with RuleSection, RulesConfirmCheckbox (`size-6 text-sm`), footer `grid-cols-1 sm:grid-cols-2 gap-3` with md buttons.
- **LaneErrorDialog** (`app/routes/restocking/_components/lane-error-dialog.tsx:51`): `max-w-dialog p-6 gap-6`; TriangleAlert size-7 `text-error` next to a left-aligned bold message; code list `text-xs`; md button `w-full`.
- **DisplayReservationBlockedDialog** (`:20`): `max-w-3xl p-6 gap-5`; title with CircleAlert size-9 `text-error`; illustration on `bg-muted rounded-md`; md OK button `mx-auto min-w-33 px-8`.
- **ScannerRecoveryDialog** (`:17`): `max-w-130 p-8 text-center`; QR in `rounded-md border p-4`; sm Close `min-w-33`.
- **RobotPowerDialog** (`:41`): `max-w-150 p-8`; title plus `Dialog.Close`; status pill; 144px round button.
- **ProductDetailDialog** (`:24`): `max-w-dialog-sm p-8`; heading is a plain `h3 text-base`, not `Dialog.Title`; sm Close.
- **SameJanDialog** (`:27`): `max-w-dialog-lg p-8`. Its footer puts **No (secondary) on the left and Yes on the right**, the opposite order to ConfirmDialog.
- **RecommendationChangeDialog** (`layout-send-dialogs.tsx:96`): `max-w-dialog-lg p-8`.
- **ProductPickerOverlay** (`:47`): `max-w-dialog-lg p-6`; secondary "Cancel" in the header.
- **ProductSearchDialog** (`:58`): `max-w-dialog-xl p-6`; uses `PanelTitle` as its title; primary "Cancel" at the bottom.
- **LayoutChangeReview** (`:48`): `max-w-dialog-xl h-[92dvh] p-4 md:p-5`.
- **HomeEStopDialog** (`home-estop-dialog.tsx:33`):
  - Panel `w-160 p-6 gap-6`, built from AttentionHeading, a step list, a video and AttentionSupport.
  - Closes with a secondary lg `w-full` button.
- **HomeMoreActions dialog** (`home-more-actions.tsx:59`): `w-240 p-6`; title overridden to `text-display/tight`; `Dialog.Close`.
- **Help (VideoTutorialDialog)** (`video-tutorial-dialog.tsx:137`):
  - Panel `max-w-306 max-h-205`, `layer="raised"`.
  - Header `h-20 border-b px-6`; title is CircleHelp size-5 `text-info` plus text.
  - Search pill and `Dialog.Close` in the header.
- **LanguageMenu** (`language-menu.tsx:39`): `max-w-5xl border p-10`; title rendered as a `p` at `text-display`; `Dialog.Close`.
- **Robot-arm Popover** (`robot-arm-control.tsx:62`): `w-88 p-6`.
- **Full-screen overlays (not dialogs):** RobotLockView (`robot-lock-view.tsx:24`, `fixed inset-0 bg-inverse/90`, Wrench size-16, `text-xl`) and HomeIdleScreen.

### Where dialogs differ
- **How to dismiss:**
  - X button (robot power, more actions, help, language)
  - Secondary "Cancel" at top right (FinishWork, ProductPicker)
  - Primary "Cancel" at the bottom (ProductSearch)
  - Full-width secondary lg "Close" (EStop)
  - Primary sm "Close" (Scanner, ProductDetail)
  - No visible close (Confirm/Message use the scrim or a button)
- **Padding:** `p-5`, `p-6`, `p-8`, `p-10`, `px-8 pt-12 pb-10`, `px-8 py-12`.
- **Title:** `xl` default, or overridden to `text-display`, `display/tight` or `xl/snug`; centred vs left-aligned.
- **Footer button size:** sm, md or lg (with `h-16`).
- **Button order:** primary-left in most, primary-right in SameJan.

---

## 4. Status, notice lines and banners

### Warning notices (same role, 7 looks; all hand-written)
| Where | Border | Radius | Padding | Text | Icon |
|---|---|---|---|---|---|
| `lane-detail-drawer.tsx:220` (removal blocked) | `border-2 border-warning` | lg | `px-3 py-2` | xs bold | Info 4 |
| `sku-removal-panel.tsx:59` (**the same removal-blocked message**) | none | sm | `p-2` | xs bold | Info 4 |
| `manual-finish-dialog.tsx:51` | `border-2 border-warning` | md | `px-3 py-2` | sm bold | TriangleAlert 5 `text-warning` |
| `restocking-start-dialog.tsx:62` | none | md | `px-3 py-2` | xs bold | TriangleAlert 5 `text-warning` |
| `restocking-board-view.tsx:335` (aged stock) | none | sm | `p-2` | xs bold | none |
| `manual-replenishment-view.tsx:182` (**the same aged-stock message**) | none | md | `px-3 py-1.5` | sm bold | Clock 5 `text-warning` |
| `layout-change-review.tsx:134` (robot will stop) | none | md | `px-3 py-2` | sm bold | none |
| `login-view.tsx:149` (offline, floating) | `border border-warning` | md | `px-3 py-2` | xs bold, with shadow | WifiOff 4 |

All use `bg-warning-subtle`.

### Error notices
| Where | Classes | Notes |
|---|---|---|
| `lane-error-alert.tsx:19` | `role=alert`, `border-2 border-error bg-error-subtle rounded-lg p-4` | header `text-xs text-error` with TriangleAlert 4; body `text-base/snug` |
| `recommendation-list-view.tsx:203` | `role=alert`, same shell | TriangleAlert 6; `text-base/snug`; secondary lg Retry |
| `manual-replenishment-view.tsx:171` | `role=alert`, `border-2 border-error bg-error-subtle rounded-md px-3 py-2 text-sm/snug` | no icon |
| `recommendation-table-body.tsx:28` | centred, like an empty state | TriangleAlert 7, `text-sm`, secondary md Retry |
| `home-detector-panel.tsx:107`, `:123` | `role=status`, `rounded-md bg-error-subtle px-4 py-2 text-base bold text-error` | neutral version uses `bg-subtle`; "checking" is plain `text-base text-secondary` |
| `walk-in-view.tsx:177` (StopStatus) | `role=status`, `text-lg/relaxed bold`, `text-error` or `text-secondary` | no background at all |
| `lane-drink-row.tsx:164` (RowAlert) | solid `bg-error`, `bg-warning` or `bg-inverse` with `text-inverse`, `rounded-md px-3 py-1 text-xs` | TriangleAlert 4 |

### Info and success
- `change-display-layout-editor.tsx:121`: `rounded-lg border border-info bg-info-subtle p-3`, Clock3 6 `text-info`, bold title plus `text-sm` line, secondary button.
- `change-display-layout-editor.tsx:151`: `rounded-lg bg-success-subtle p-3 bold text-success`, Check 6.

### The attention bar on Home
- `home-dashboard-view.tsx:235`: `rounded-md px-4 py-2 text-sm bold`.
- Assist tone `bg-primary-subtle text-primary-text`; otherwise `bg-error-subtle text-error`.
- Contains a held-tasks line in normal weight and the underline link button from §1b.

### Floating banners
- AppUpdateBanner (`app-update-banner-view.tsx:21`): bottom-left, `w-100 rounded-xl border bg-default p-3 shadow-dialog`, RefreshCw `text-info`, `text-xs`, primary sm button.
- PwaInstallPrompt (`pwa-install-prompt-view.tsx:90`): the same shell but bottom-right and `w-90`.

### Offline indicator (same state, two tones)
- Header chip (`app-header-view.tsx:94`): `rounded-md bg-error-subtle p-2 text-sm text-error`.
- Login (`login-view.tsx:149`): warning style, see the warning table.

### Toasts (core)
- `core/toast.tsx:104`: `w-88 rounded-lg bg-inverse p-4 text-inverse shadow-dialog`; title `text-sm bold`; description `text-xs`; coloured icon per type.
- `showScannedDrinkToast` in `app/components/product/scanned-drink-toast.tsx` adds a product thumbnail.
- `Toast.notify.warning` is called from `recommendation-list-view.tsx:139`.

### Other status lines
- Robot-arm warning line, written twice identically: `robot-arm-control.tsx:109` and `robot-arm-panel.tsx:80` (`text-sm secondary` plus TriangleAlert 5 `text-primary-text`).
- Scanned-drink status strip (`scanned-drink-card.tsx:100`).
- Cabinet-disabled overlay message (`display-cabinet-panel.tsx:68`).

---

## 5. Support / contact blocks (OPERATIONS_CENTER_PHONE, defined in `app/config/app.ts:22`)
| Where | Look |
|---|---|
| `AttentionSupport`, `attention-layout.tsx:100` (used by AttentionLayout and HomeEStopDialog) | heading `p text-base bold` with Phone 5; then a `tel:` card `rounded-lg border border-info/20 bg-info-subtle px-4 py-3` with body `text-base` and the number `text-xl bold text-info` |
| `ContactStrip`, `help-parts.tsx:87` (under every help section) | `tel:` link `rounded-lg bg-subtle px-4 py-3 text-base bold`, Phone 5, a single sentence with the number inline |
| Help "contact" section, `video-tutorial-dialog.tsx:274` | SectionTitle, then `p text-lg`, then a bare `tel:` link at `text-display/tight bold`; no card |
| Phone inside plain message text (i18n `TEL: {phone}`), not tappable, centred bold through MessageDialog | `robot-start.ts:94` (`restartThenCallCenterNotice`), `action-results.ts:319` (popup messages), `scan-alert-dialog.tsx:40` (`scanAlertNotInSystem`), `use-layout-editor.ts:392` (`layoutEmptyRowBlocked`) |

That is 4 looks. Only the first two are tappable cards, and they differ: info-tinted with a border vs a subtle grey bar.

---

## 6. Headings

### Headings with a yellow left bar (6 sizes)
| Where | Classes |
|---|---|
| `PanelTitle`, `components/layout/panel-title.tsx:13` | `border-l-4 border-primary pl-2 bold`; md `text-lg`, sm `text-base`; `mt-4 first:mt-0` |
| `core/drawer.tsx:52` (Drawer.Title) | `border-l-4 pl-3 text-lg` (note `pl-3`) |
| `rule-section.tsx:15` | `border-l-4 pl-2 text-xs/tight` |
| `reservation-list.tsx:70` | `border-l-4 pl-2 text-sm` |
| `login-view.tsx:108` | `border-l-4 pl-2 text-xl` |
| `home-section-title.tsx` (unused) | `text-xl/tight` |

### Page titles (no consistent pattern)
- PanelTitle at lg: display-shelf `:189`, recommendation-list `:156`, capture step `:44`; each followed by a `text-sm bold secondary` subtitle.
- Plain `h1 text-xl bold`:
  - layout editor (`change-display-layout-editor.tsx:89`) with an Eye-icon subtitle
  - settings (`settings-view.tsx:91`) with an eyebrow `text-sm text-primary-text`
  - work report (WIP)

### Small grey section titles
- `help-parts.tsx:11` SectionTitle: `h3 text-base bold secondary`
- `home-robot-status.tsx:112`: `text-sm lg:text-base secondary`
- `home-robot-status.tsx:313`: `text-lg tracking-wider secondary`
- `display-cabinet-panel.tsx:43`: `text-xs secondary`
- `layout-send-dialogs.tsx:130`: `text-sm`

### Headings with an icon
- `AttentionHeading` (`attention-layout.tsx:64`): icon size-16 `text-error` plus a "!" badge (`size-8 bg-error text-xl`); `h2 text-xl/tight`; body `text-lg secondary`.
- `SettingsSection` (`settings-section.tsx:22`): icon size-7 `text-primary-text`, title `text-xl`.
- DisplayReservationBlocked title: CircleAlert 9 `text-error`.
- LaneErrorDialog: TriangleAlert 7 with message.
- Help header: CircleHelp 5 `text-info`.
- Home "stops robot" label (`home-dashboard-view.tsx:284`): Power 5 with `text-lg/tight secondary`.
- "Scan instruction", same copy at two sizes: `layout-selection-bar.tsx:64` (ScanBarcode 6, `text-lg`) vs `product-picker-overlay.tsx:84` (ScanBarcode 6, `text-base`).

### Large display text
- `home-attention-panel.tsx:210`: `text-display`
- DontEnterCard: `text-display/tight`
- Idle status: `text-[4.875rem]`
- Walk-in pill and Home card title: `text-[2rem]`
- RobotArmPanel title: `text-[1.875rem]`

---

## 7. Numbered steps and instructions
- E-stop steps (`home-estop-dialog.tsx:56`): `ol text-lg bold`; number in a `size-8 rounded-full bg-inverse text-base text-inverse` circle.
- Reservation queue (`reservation-list.tsx:49`): number in a `size-7 rounded-sm bg-muted text-xs bold` square.
- Lane drink position (`lane-drink-row.tsx:69`): `w-7 rounded-full bg-muted text-base bold`, a tall pill.
- Bulleted list, WIP (`work-report-view.tsx:273`): `size-3` dark dot.
- Instructions written as paragraphs:
  - walk-in hints (`walk-in-view.tsx:90`, `text-lg/relaxed`)
  - capture question (`change-display-layout-capture-step.tsx:56`, `text-lg/relaxed`, example `text-sm/relaxed secondary`)
  - `stopsRobot` line
  - layout selection empty state (`layout-selection-bar.tsx:38`)

Three different number-badge styles: dark circle, grey square, grey pill.

---

## 8. Camera, images and media
| Where | Frame | Caption |
|---|---|---|
| AttentionCamera, `attention-layout.tsx:138` | `rounded-lg bg-inverse`, `min-h-48`, no border; placeholder Camera 12 at opacity 40; timestamp `text-sm bold opacity-70` aligned right | figcaption `text-base bold`, with the dashed key in `#FF2D20` |
| E-stop video, `home-estop-dialog.tsx:73` | `w-56`, `aspect-640/598`, `rounded-lg ring-1 ring-black/10` | `text-base`, regular weight |
| VideoPlayerPanel, `video-player-panel.tsx:32` | `aspect-video max-w-222.5 rounded-lg border bg-inverse`; loading overlay `bg-muted` (Loader2 10, `text-xl`); error overlay `bg-default` (VideoOff 12, `text-xl/relaxed`, secondary md Retry) | `h3 text-xl/tight` above |
| VideoCard thumbnail, `help-parts.tsx:31` | `aspect-video bg-inverse`, play badge `size-12 bg-default/90` | — |
| DeckReader page, `deck-reader.tsx:83` | `rounded-lg ring-1 ring-black/10` | `text-xl/tight` heading plus page counter |
| RulePhoto, `rule-photo.tsx:26` | `aspect-120/73 rounded-md border-5` in success/error colour, plus a `size-8 rounded-sm` badge | `text-xs/tight bold`, centred |
| RuleFigure, `restocking-start-dialog.tsx:133` | no frame (the image carries its own) | same caption as RulePhoto (duplicated) |
| PromptPhotos, `prompt-photos.tsx:7` | `aspect-square rounded-md` | — |
| FinishWork image row, `finish-work-dialog.tsx:48` | `rounded-xl bg-subtle p-3`; image `h-20 w-24 rounded-lg` | `text-base/relaxed bold` |
| Illustration boxes | `display-reservation-blocked-dialog.tsx:34`, `:55` (`bg-muted rounded-md p-4/p-6`); `shelf-question-illustration.tsx:12` (`bg-subtle rounded-md p-4`); scanner QR (`rounded-md border p-4`); product detail (`size-44 rounded-md bg-subtle`) | — |
| Robot | `RobotClip` (`robot-clip.tsx`); `RobotArmIllustration` (hard-coded greys) | — |
| Shared thumbnail | `ProductThumb` (`product-thumb.tsx`); placeholder `bg-subtle`; cut-product label `bg-inverse` | — |

**Media frames differ:** `ring-1 black/10`, `border-default`, or nothing. Radius is lg everywhere except RulePhoto (md). Figure captions are `text-base bold`, `text-base regular`, or `text-xs bold centred`.

---

## 9. Progress, countdown and loading
- **Core:** Button `busy` (Loader2 spinner), toast `loading` type.
- **Blocking spinner dialogs:** ConnectingDialog and ShelfMovingDialog (Loader2 12, `text-primary-text`).
- **Inline loading lines (three looks):**
  - `recommendation-table-body.tsx:52`: Loader2 6, `text-sm bold secondary`, `min-h-56`
  - `recommendation-list-view.tsx:225`: **LoaderCircle** 6, `text-base`, `py-12`
  - `reservation-list.tsx:27`: text only, `text-xs`, `min-h-48`
- **Video loading overlay:** `video-loading-state.tsx:5` (Loader2 10, `bg-muted`).
- **Countdown:** `HomeRecoveredPanel` (`home-attention-panel.tsx:216`) has a `w-64 h-1.5 rounded-full` track in `bg-subtle` with a `bg-success` fill over 5000ms, and a "back in N s" line in `text-base secondary`. This is the only progress bar in the app.
- **Ambient motion:**
  - `animate-pulse` dots (in-progress pill, HomeActionTile)
  - `.attention-blink`, `.idle-wake-ripple`, `.lane-flash`
  - robot-arm slide (`duration-5000`)
  - Walk-in StopStatus deliberately has no progress bar (comment at `walk-in-view.tsx:166`)

---

## 10. Tags, badges, pills and status chips
- **Robot status pill (4 renderings, 4 sizes, different sets of tones):**
  - `home-robot-status.tsx:115`: `rounded-full px-4 py-2 text-xl/tight bold`; assist `bg-primary`, cause `attention-blink bg-error`, moving `bg-success`, resting `bg-muted`
  - `robot-power-dialog.tsx:55`: `rounded-full px-4 py-1.5 text-base`; only moving or resting
  - `walk-in-view.tsx:60`: `rounded-full px-6 py-2 text-[2rem]/tight`; moving or resting
  - `home-robot-status.tsx:293` (idle screen): `rounded-xl px-8 py-5 text-[4.875rem]` when loud, otherwise a dot plus text
- **In-progress pill:** `home-object-action.tsx:190` (`rounded-full bg-default px-5 py-2 text-xl` plus a 3.5 pulsing green dot) vs the unused `home-action-tile.tsx:45` (`bg-inverse px-2.5 py-1 text-xs`, 2px dot).
- **Footer status chips** (`app-status-footer.tsx:67`, `:94`): `h-8 rounded-md px-3 text-xs bold` plus a size-2 dot; tones `success-subtle`, `error-subtle`, `primary-subtle`.
- **Scanner status shown two ways:** header plain text with a coloured icon (`app-header-status.tsx:21`) vs the footer chip.
- **Environment label shown two ways:** header `rounded-md bg-default px-2 py-1 text-xs secondary` (`app-header-view.tsx:85`) vs login `rounded-full bg-error px-4 py-1 text-sm tracking-wider text-inverse` (`login-view.tsx:65`).
- **ManualSessionStatus chips** (`manual-session-status.tsx:17`): `h-7 rounded-full px-3 text-xs` with svg 4; tones `error-subtle`, `success-subtle`, `muted`.
- **CabinetTabLabel** (`cabinet-tab-label.tsx:55`): summary chip `h-6 rounded-full px-2 text-xs`; corner count `absolute -top-2 -right-2 rounded-full px-2 text-xs/5 ring-2 ring-white`.
- **Lane cells:**
  - StockLane count `rounded-full px-1.5 text-xs/4`, bottom right (`stock-lane.tsx:105`, `:113`)
  - `LaneBadge` round icon, `size-5 ring-2 ring-white` (`lane-badge.tsx`)
  - Changed mark in `change-layout-cell-button.tsx:70` (size-5)
  - `LaneLegend` swatches
- **"Not on display" count:** identical copies at `restocking-board-view.tsx:360` and `manual-replenishment-view.tsx:160` (`rounded-sm bg-warning-subtle px-2 text-xs`).
- **"Unsent changes" (same concept, 3 sizes):**
  - `layout-editor-toolbar.tsx:73`: `px-3 py-1 text-xs`
  - `change-display-layout-editor.tsx:175`: `px-3 py-1 text-sm`
  - `layout-change-review.tsx:63`: `px-4 py-2 text-base`
  - All `rounded-full bg-warning-subtle`.
- **Other chips:**
  - Changed-row chips: `layout-change-review.tsx:100`, `rounded-md bg-subtle px-3 py-2 text-sm`
  - RowChip: `lane-drink-row.tsx:184`, `rounded-full px-2 py-1 text-xs`
  - Column labels: `lane-card.tsx:45` (`h-4 rounded-full bg-muted text-xs/4`) vs `selected-lane-card.tsx:45` (`rounded-full bg-muted px-4 py-1 text-lg`)
  - Detector state: `DetectorRow` (`home-robot-status.tsx:186`) and idle detector tiles (`:319`, `rounded-xl p-4`)

---

## 11. Empty states, list rows and nav lists

### Empty states (about 10, sizes `text-xs` to `text-xl`)
| Where | Classes |
|---|---|
| `shelf-grid.tsx:38` | `min-h-64 text-base bold secondary` |
| `product-search-dialog.tsx:113` | `min-h-56 text-base` |
| `product-picker-overlay.tsx:134` | `min-h-64 rounded-md bg-muted text-base` |
| `lane-detail-drawer.tsx:248` | `min-h-40 rounded-lg bg-subtle text-sm` |
| `recommendation-table-body.tsx:64` | `min-h-56 text-sm` |
| `recommendation-list-view.tsx:248`, `:254` | `py-12 text-base` |
| `reservation-list.tsx:27` | `min-h-48 text-xs` |
| `selected-lane-card.tsx:30` | `rounded-lg border px-4 py-8 text-xs/relaxed` |
| `layout-selection-bar.tsx:38` | `min-h-20 rounded-lg border`, icon plus `text-lg` |
| `video-tutorial-dialog.tsx:411` | `text-xl bold` |

### List rows
- LaneDrinkRow (`lane-drink-row.tsx:51`): `rounded-lg border-2 border-default p-2`, state tones.
- ReservationList item (`reservation-list.tsx:46`): `rounded-md border p-2`.
- RecommendationRowCard (`restocking-recommendation-row.tsx:31`): table row, `min-h-12 rounded-md px-1.5`.
- RecommendationListRow (`recommendation-list-row.tsx:35`): `min-h-24 rounded-md border px-4 py-3`.
- DocList, PageCard: see §2.
- **Product header written twice:** `scanned-drink-card.tsx:63` and `sku-removal-panel.tsx:42` both use `grid-cols-[32px_minmax(0,1fr)] p-2`, a `h-16 w-8` thumbnail and a `text-xs/tight` name. Card shells are `rounded-lg border-2` in success/default vs error.
- Settings rows (`settings-section.tsx:19`): `rounded-lg border bg-subtle p-6`.

### Nav lists
- Help NavItem (`video-tutorial-dialog.tsx:306`): `min-h-12 rounded-md px-3 text-lg bold`; active `bg-primary-subtle text-primary-text`; inactive `text-secondary`.
- Deck-reader sections (`deck-reader.tsx:56`): `min-h-11 rounded-md px-3 py-2 text-base/tight`; active `bg-primary-subtle bold text-primary-text`; **inactive `text-primary` at normal weight**.
- Both hand-written. They differ in height, text size, weight and inactive colour.
- CabinetTabs: see §1f.

---

## 12. Layout shells and panels
- **App frame:**
  - `AppScreen` (`app-screen.tsx`)
  - Chrome section `bg-subtle p-4` (`app/routes/chrome-layout.tsx:80`); Home runs edge to edge
  - Header `h-16 sm:h-18 border-b` (`app-header-view.tsx:62`)
  - Footer `h-10 text-xs` (`app-status-footer.tsx:54`)
- **Two-column attention layout:** `AttentionLayout` (`attention-layout.tsx:39`). Grid of 2 columns with `gap-5`; the left column is `gap-6`, and support plus action sit in a `gap-12` block. Used by HomeAttentionPanel and HomeDetectorPanel; HomeEStopDialog reuses its parts.
- **Walk-in:** `walk-in-view.tsx:83` (`bg-subtle p-6`, 2 columns, `gap-6`).
  - RobotArmPanel card: `rounded-xl bg-default p-6`.
  - DontEnterCard: `rounded-xl border-2 border-warning bg-[#fde4d2] p-8`.
- **Home:**
  - Grid `lg:grid-cols-[41%_1fr]` (`home-dashboard-view.tsx:177`)
  - Status aside `bg-subtle p-4 lg:p-5` (`home-robot-status.tsx:110`)
  - Detector box `rounded-xl border-2 bg-default p-4` (`:134`)
  - Tinted "stops the robot" group `rounded-xl bg-black/3 p-3` (`home-dashboard-view.tsx:283`); a hard-coded tint where `bg-subtle` exists
  - Idle-screen tints: `success-subtle/50`, `subtle`, `error-subtle`, `primary-subtle` (`home-robot-status.tsx:284`)
- **Page content cards** (`rounded-lg border bg-default`, padding drifts):
  - display-shelf `p-3` (`:238`)
  - recommendation-list `p-4` (`:162`)
  - layout editor `p-4` (`:86`)
  - settings `p-6` (`settings-view.tsx:83`)
  - capture step `p-8` (`:51`)
- **Tinted inner panels** (`bg-subtle` or `bg-muted`, radius and padding drift):
  - `rounded-lg p-2`: restocking `:367`, manual `:189`
  - `rounded-md p-2`: display cabinet `:48`, layout editor grid `:181`
  - `rounded-lg p-3`: reservation list `:69`, selected lane `display-shelf-view.tsx:288`
  - `rounded-xl p-3`: finish-work
  - `rounded-xl bg-primary-subtle p-4`: finish-work CTA box
  - `rounded-md bg-muted p-4`: reservation-blocked
  - core `Dialog.Content`: `rounded-lg p-3`
  - `layout-shelf-canvas.tsx:25`: `rounded-lg border bg-subtle`
- **Other cards:**
  - RuleSection (`rule-section.tsx:14`): `rounded-lg border bg-default p-3`
  - Login split (`login-view.tsx:82`): `rounded-xl border bg-subtle`, inner `rounded-xl bg-default`
  - WIP Box and Stat: `rounded-xl border p-5`
  - Floating cards: AppUpdate and PWA (§4)

---

## 13. Search fields and inputs (extra role)
| Where | Height / shape / border | Focus | Icon / text |
|---|---|---|---|
| `video-tutorial-dialog.tsx:149` (help) | `h-13 rounded-full border-2 border-black/20 px-5` | border to `border-strong` | Search 5, `text-lg` |
| `product-search-dialog.tsx:68` | `h-14 rounded-md border-2 border-strong px-4` | `border-primary` plus `ring-2` | Search 6, `text-base bold` |
| `recommendation-list-view.tsx:164` | `h-14 rounded-md border border-strong px-4` | `ring-2` | Search 6, `text-base bold` |
| `product-picker-overlay.tsx:88` | `h-14 rounded-md border border-strong px-3` | **no focus style** | Search **4**, `text-base` |
| Settings Combobox (`settings-view.tsx:107`) | `h-14 rounded-md border border-strong px-4` | `ring-2` | `text-base bold` |
| Display history Select (`display-shelf-view.tsx:198`) | `h-11 rounded-md border border-strong px-3` | — | `text-xs bold` |
| Login fields (`login-view.tsx:118`, `password-field.tsx:28`) | **`h-8`** `rounded-md border border-strong` | — | `text-xs`; very small on a tablet |
| NumberField input (`recommendation-list-row.tsx:56`) | `h-12 rounded-md border border-strong bg-subtle` | — | `text-xl` |

**Checkbox sizes vary:** `size-6` (RulesConfirmCheckbox), default `size-4` (layout toolbar, inside an `h-9 bg-subtle` chip; layout editor), `size-5` (WIP).

---

## Ranked consolidations (biggest payoff first)

1. **`ChoiceCard` / `ActionTile`.** One large tappable card with an icon box, label, optional sub-label and optional chevron. Variants: row and column; sizes md (`min-h-24`) and lg (`min-h-40`); a selected state.
   - Replaces: walk-in entry (`home-dashboard-view.tsx:359`), "その他" entry (`home-more-actions.tsx:34`), "その他" dialog tiles (`:72`), language tiles (`language-menu.tsx:67`), FinishWork "continue" (`finish-work-dialog.tsx:61`), DocList (`video-tutorial-dialog.tsx:444`), PageCard and VideoCard (`help-parts.tsx:24`, `:67`), SelectedLaneCard (`selected-lane-card.tsx:38`), and the HomeObjectAction outline.
   - Settles 1px vs 2px borders, `black/20` vs `black/30` vs `border-default`, md vs lg radius, and the pressed colour.
2. **`Notice` / `InlineAlert`.** Tone (info, success, warning, error) × emphasis (bordered, subtle, solid) × size (sm, md), with an optional icon and action.
   - Replaces about 18 lines across §4: `lane-detail-drawer.tsx:220`, `sku-removal-panel.tsx:59`, `manual-finish-dialog.tsx:51`, `restocking-start-dialog.tsx:62`, `restocking-board-view.tsx:335`, `manual-replenishment-view.tsx:171`, `:182`, `layout-change-review.tsx:134`, `lane-error-alert.tsx:19`, `recommendation-list-view.tsx:203`, `change-display-layout-editor.tsx:121`, `:151`, `home-detector-panel.tsx:107`, `:123`, `walk-in-view.tsx:177`, `login-view.tsx:149`, the Home attention bar `:235`, and RowAlert.
   - Two messages already render two ways each: removal-blocked and aged-stock.
3. **Dialog templates.** Three shapes:
   - `AlertDialog`: optional title, message, footer with a fixed button order and size
   - `BlockingDialog`: spinner or icon with a message
   - `PanelDialog`: header with title and X, a body, and a footer
   - Merges RestockingEndNext and ManualFinishNext into ConfirmDialog with a title, and ConnectingDialog with ShelfMoving.
   - Makes `askOperator` render one family instead of the ChoiceDialog / ConfirmDialog / MessageDialog trio (`action-prompt-dialog.tsx`).
   - Moves `w-160`, `w-172`, `w-240`, `max-w-130`, `max-w-150` and `max-w-3xl/4xl/5xl` onto `dialog-*` tokens.
   - Fixes: SameJan's reversed button order; ad-hoc Cancel/Close buttons in FinishWork, ProductPicker (secondary at top) and ProductSearch (primary at bottom); `rounded-[1.25rem]`.
4. **`IconButton`.** Sizes sm 32, md 40, lg 48; shapes circle and square; tones ghost, outline and primary.
   - Replaces about 14 hand-written ones from §1d: header QR/power, settings, footer QR, search clear, PWA close, password toggle, recommendation delete, row-lane ±, cell edge buttons, the layout-selection-bar clear, and WIP month arrows. Could also become the base of CloseButton.
5. **Header `PillButton` / `ToolbarButton`.** One height (44), one border rule, an active ring.
   - Replaces app-header work report, idle, help, refund and settings (`app-header-view.tsx:100-180`), the LanguageMenu trigger (`language-menu.tsx:32`), HeaderActionButton, unused TopButton, and the login manual pill (`login-view.tsx:94`).
6. **`SupportContact`.** Variants: card and strip. A tappable `tel:` link.
   - Replaces AttentionSupport (`attention-layout.tsx:100`), ContactStrip (`help-parts.tsx:87`) and the help contact section (`video-tutorial-dialog.tsx:274`).
   - Would let MessageDialog show the number as a tappable block instead of the `TEL: {phone}` text (`robot-start.ts:94`, `action-results.ts:319`, `scan-alert-dialog.tsx:40`, `use-layout-editor.ts:392`).
7. **`StatusPill` / `Badge` / `Chip`.** Tones (neutral, success, warning, error, primary, inverse, plus an attention blink) × sizes (xs to xl), with an optional dot or icon.
   - Replaces the 4 robot-status pills (`home-robot-status.tsx:115`, `robot-power-dialog.tsx:55`, `walk-in-view.tsx:60`, idle `:293`), footer chips, ManualSessionStatus chips, the duplicated "not on display" chip, the 3 "unsent changes" chips, the 2 environment labels, the 2 offline indicators, the in-progress pill, and RowChip.
8. **`SectionHeading` with a yellow bar, plus a `PageHeader`** (title, subtitle, leading slot, actions).
   - Unifies PanelTitle, Drawer.Title (`pl-3`), RuleSection h3 (`text-xs`), ReservationList h3 (`text-sm`), login h2 (`text-xl`), and the unused HomeSectionTitle.
   - Gives display-shelf, recommendation-list, layout-editor, settings and the capture step one header pattern.
9. **`SegmentedControl` and `NavList`, both built on ToggleGroup.**
   - SegmentedControl replaces CabinetTabs, settings idle timeout, layout-review before/after, the row chooser and the WIP Segmented, which today use 4 different selected styles.
   - NavList replaces help NavItem (`video-tutorial-dialog.tsx:306`) and deck-reader sections (`deck-reader.tsx:56`).
   - Add `BackButton` for the two identical copies (`video-tutorial-dialog.tsx:327`, `deck-reader.tsx:45`).
10. **`SearchField` / `TextField` sizing.** Replaces the 4 search boxes (help, ProductSearch, RecommendationList, ProductPicker), the settings Combobox frame, the history Select frame, and the `h-8` login fields.
11. **`EmptyState` and `LoadingState`.** One size scale and a standard spinner (Loader2 vs LoaderCircle).
    - Replaces about 10 empty lines (§11) and 4 loading lines (§9), plus RecommendationTableBody's error-as-empty block.
12. **`ProductTile`, `MediaFrame`/`Figure`, and `StepList`.**
    - ProductTile merges `product-search-dialog.tsx:86` and `product-picker-overlay.tsx:107`.
    - MediaFrame/Figure merges AttentionCamera, the e-stop video, VideoPlayerPanel, the DeckReader image, and RulePhoto/RuleFigure captions.
    - StepList unifies the 3 number-badge styles (e-stop, reservation queue, lane drink position).

**Housekeeping:**
- Delete the unused components listed at the top.
- Add the missing Button variants and sizes that are being hand-built: `xl` (walk-in), warning (robot arm), inverse (WIP), text link.
- Drop `destructive` or start using it (0 uses today).
- Replace the hard-coded colours and `bg-black/3` with tokens.
- Remove the dead `titleLeading` prop on SettingsView.
- Give the login logo button an `onClick` or make it a non-button element.
