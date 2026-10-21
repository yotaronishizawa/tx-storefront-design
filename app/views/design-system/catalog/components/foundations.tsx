import { useEffect, useRef, useState } from "react"

import { cn } from "~/utils/cn"

import { useDocText, type DocText } from "./doc-lang"
import { DocSection, SubTitle, UseWhen } from "./doc-parts"

/*
 * Values and usage follow the Figma "Store App (Web) Styles" page (Ethan,
 * 2026-10-21). The catalog reads each colour from the page, so the numbers
 * shown are always what the app really uses.
 */

type Swatch = { name: string; className: string; use: DocText }

// Class names are written out in full so Tailwind generates them.
const COLOUR_GROUPS: { title: DocText; swatches: Swatch[] }[] = [
  {
    title: { en: "Background", ja: "背景" },
    swatches: [
      {
        name: "bg-default",
        className: "bg-default",
        use: {
          en: "Page, card and modal background",
          ja: "画面・カード・ポップアップの背景",
        },
      },
      {
        name: "bg-subtle",
        className: "bg-subtle",
        use: {
          en: "Section background, grouped areas",
          ja: "セクションの背景、まとまりの地",
        },
      },
      {
        name: "bg-muted",
        className: "bg-muted",
        use: {
          en: "Disabled controls, chip background, pressed row",
          ja: "押せないボタン、チップの地、押した行",
        },
      },
      {
        name: "bg-inverse",
        className: "bg-inverse",
        use: {
          en: "Toast and dark banner background",
          ja: "トースト・暗い帯の背景",
        },
      },
      {
        name: "bg-overlay",
        className: "bg-overlay",
        use: {
          en: "Scrim behind dialogs and panels (black 30%)",
          ja: "ポップアップ・パネルの後ろの幕（黒30%）",
        },
      },
    ],
  },
  {
    title: { en: "Text and icon", ja: "文字・アイコン" },
    swatches: [
      {
        name: "text-primary",
        className: "bg-(--text-color-primary)",
        use: { en: "Main text and icons", ja: "主な文字とアイコン" },
      },
      {
        name: "text-secondary",
        className: "bg-(--text-color-secondary)",
        use: {
          en: "Secondary text, captions, inactive icons",
          ja: "補足の文字、キャプション、選ばれていないアイコン",
        },
      },
      {
        name: "text-disabled",
        className: "bg-(--text-color-disabled)",
        use: { en: "Disabled text and icons", ja: "押せない文字とアイコン" },
      },
      {
        name: "text-inverse",
        className: "bg-(--text-color-inverse)",
        use: {
          en: "Text on dark, error or success background",
          ja: "暗い地・エラー・成功の地の上の文字",
        },
      },
      {
        name: "text-on-primary",
        className: "bg-(--text-color-on-primary)",
        use: {
          en: "Text and icons on primary",
          ja: "黄色（primary）の上の文字とアイコン",
        },
      },
    ],
  },
  {
    title: { en: "Border", ja: "線" },
    swatches: [
      {
        name: "border-default",
        className: "bg-(--border-color-default)",
        use: {
          en: "Dividers, card and list borders",
          ja: "区切り線、カード・一覧の枠",
        },
      },
      {
        name: "border-strong",
        className: "bg-(--border-color-strong)",
        use: {
          en: "Input fields and controls that need a visible edge (3:1)",
          ja: "はっきりした縁が必要な入力欄・操作部品（3:1）",
        },
      },
      {
        name: "border-control",
        className: "bg-(--border-color-control)",
        use: {
          en: "v2: 2px outline of anything tappable that is not a Button",
          ja: "v2：Button以外で押せるものの2pxの外枠",
        },
      },
    ],
  },
  {
    title: { en: "Primary", ja: "プライマリー" },
    swatches: [
      {
        name: "primary",
        className: "bg-primary",
        use: {
          en: "Main buttons, selected state, active tab",
          ja: "主なボタン、選択中、選ばれたタブ",
        },
      },
      {
        name: "primary-pressed",
        className: "bg-primary-pressed",
        use: {
          en: "Primary button while pressed",
          ja: "押している間の主なボタン",
        },
      },
      {
        name: "primary-subtle",
        className: "bg-primary-subtle",
        use: {
          en: "Selected row or card background",
          ja: "選択中の行・カードの地",
        },
      },
      {
        name: "primary-text",
        className: "bg-primary-text",
        use: {
          en: "Primary colour for text and icons on white",
          ja: "白の上で使う黄色系の文字・アイコン",
        },
      },
    ],
  },
  {
    title: { en: "Status", ja: "状態" },
    swatches: [
      {
        name: "error",
        className: "bg-error",
        use: {
          en: "Error text, icons, borders, destructive button",
          ja: "エラーの文字・アイコン・枠、取り消せない操作のボタン",
        },
      },
      {
        name: "error-subtle",
        className: "bg-error-subtle",
        use: { en: "Error message background", ja: "エラーのお知らせの地" },
      },
      {
        name: "error-pressed",
        className: "bg-error-pressed",
        use: {
          en: "Destructive button while pressed",
          ja: "押している間の取り消せない操作のボタン",
        },
      },
      {
        name: "warning",
        className: "bg-warning",
        use: {
          en: "Warning icons, borders, large text. Small text: text-primary on warning-subtle",
          ja: "注意のアイコン・枠・大きな文字。小さな文字は warning-subtle の上に text-primary",
        },
      },
      {
        name: "warning-subtle",
        className: "bg-warning-subtle",
        use: { en: "Warning message background", ja: "注意のお知らせの地" },
      },
      {
        name: "success",
        className: "bg-success",
        use: {
          en: "Success text, icons, borders",
          ja: "成功の文字・アイコン・枠",
        },
      },
      {
        name: "success-subtle",
        className: "bg-success-subtle",
        use: { en: "Success message background", ja: "成功のお知らせの地" },
      },
      {
        name: "info",
        className: "bg-info",
        use: {
          en: "Info icons, the support phone number",
          ja: "情報のアイコン、問い合わせの電話番号",
        },
      },
      {
        name: "info-subtle",
        className: "bg-info-subtle",
        use: { en: "Info message background", ja: "情報のお知らせの地" },
      },
    ],
  },
]

const TYPE_SCALE: {
  name: string
  px: string
  className: string
  use: DocText
}[] = [
  {
    name: "text-xl",
    px: "24px",
    className: "text-xl",
    use: {
      en: "Modal title, page / section titles, home tiles",
      ja: "ポップアップの見出し、画面・セクションの見出し、ホームのタイル",
    },
  },
  {
    name: "text-lg",
    px: "20px",
    className: "text-lg",
    use: {
      en: "Modal body, buttons, panel / drawer title",
      ja: "ポップアップの本文、ボタン、パネル・ドロワーの見出し",
    },
  },
  {
    name: "text-base",
    px: "18px",
    className: "text-base",
    use: {
      en: "Default. Body text on info pages, main values (counts, days), tabs, error instruction",
      ja: "基本の大きさ。情報ページの本文、主な数値（本数・日数）、タブ、エラーの指示",
    },
  },
  {
    name: "text-sm",
    px: "16px",
    className: "text-sm",
    use: { en: "Row labels, secondary info", ja: "行のラベル、補足情報" },
  },
  {
    name: "text-xs",
    px: "14px",
    className: "text-xs",
    use: {
      en: "Small labels, dates, support codes, product names, chips",
      ja: "小さなラベル、日付、サポートコード、商品名、チップ",
    },
  },
]

const SPACING_STEPS = [1, 2, 3, 4, 5, 6, 8, 10, 12]

const SPACING_RHYTHM: { step: string; use: DocText }[] = [
  {
    step: "2 · 8px",
    use: {
      en: "Inside one element: icon to label, heading to its card",
      ja: "ひとつの要素の中：アイコンとラベル、見出しとそのカード",
    },
  },
  {
    step: "4 · 16px",
    use: {
      en: "Between blocks in a dialog; items of one group; a label above a picture",
      ja: "ポップアップの中のブロックどうし、同じまとまりの項目、画像の上のラベル",
    },
  },
  {
    step: "6 · 24px",
    use: {
      en: "Between sections on a screen",
      ja: "画面の中のセクションどうし",
    },
  },
  {
    step: "12 · 48px",
    use: {
      en: "Before the main action of an attention screen",
      ja: "要対応画面の主な操作の前",
    },
  },
]

const RADII: { name: string; px: string; className: string; use: DocText }[] = [
  {
    name: "rounded-sm",
    px: "4px",
    className: "rounded-sm",
    use: { en: "Chips, tags, small badges", ja: "チップ、タグ、小さなバッジ" },
  },
  {
    name: "rounded-md",
    px: "8px",
    className: "rounded-md",
    use: {
      en: "Buttons, inputs, list items",
      ja: "ボタン、入力欄、一覧の項目",
    },
  },
  {
    name: "rounded-lg",
    px: "12px",
    className: "rounded-lg",
    use: { en: "Cards, list groups", ja: "カード、一覧のまとまり" },
  },
  {
    name: "rounded-xl",
    px: "16px",
    className: "rounded-xl",
    use: { en: "Modals, panels", ja: "ポップアップ、パネル" },
  },
  {
    name: "rounded-full",
    px: "9999px",
    className: "rounded-full",
    use: { en: "Pill buttons, round badges", ja: "ピル型のボタン、丸いバッジ" },
  },
]

export function Foundations() {
  const tx = useDocText()
  return (
    <>
      <DocSection
        id="ui-size"
        title={{ en: "Screen size", ja: "画面サイズ" }}
        lead={{
          en: "Design at 1180×820: the iPad screen in CSS px, at 1x, so every value in Figma is the same in code.",
          ja: "1180×820 でデザインします。iPad の画面を CSS px で表した大きさ（1倍）なので、Figma の数値がそのままコードの数値になります。",
        }}
      >
        <div className="grid aspect-1180/820 w-full max-w-xl place-items-center rounded-xl border-2 border-dashed border-strong bg-default">
          <span className="text-display-lg font-bold">1180×820</span>
        </div>
      </DocSection>

      <DocSection
        id="colour"
        title={{ en: "Colour", ja: "色" }}
        lead={{
          en: "Named by usage: pick the token by what the element is (background, text, border), not by how light or dark it looks. Draft: colours for the new design are not final yet.",
          ja: "用途で名前を付けています。明るさ暗さではなく、その要素が何か（背景・文字・線）でトークンを選びます。下書き：新しいデザインの色はまだ確定していません。",
        }}
      >
        {COLOUR_GROUPS.map((group) => (
          <div key={tx(group.title)} className="flex flex-col gap-3">
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
            {
              en: "Red only when the robot cannot move or something failed",
              ja: "赤はロボットが動けない時・何かが失敗した時だけ",
            },
            {
              en: "Yellow (primary) for the single main action on a screen",
              ja: "黄色（primary）は画面にひとつの主な操作に",
            },
            {
              en: "Tinted backgrounds (-subtle) with near-black text on top",
              ja: "薄い色の地（-subtle）の上は黒に近い文字で",
            },
          ]}
          donts={[
            {
              en: "The neutral scale (neutral/100…900) directly: use the tokens above",
              ja: "グレーの段階（neutral/100〜900）を直接使う。上のトークンを使う",
            },
            {
              en: "Black or white with opacity (bg-black/5): pick a token",
              ja: "黒や白の透明度で色を作る（bg-black/5 など）。トークンから選ぶ",
            },
            {
              en: "A new colour for one screen: ask design to add a token",
              ja: "1画面のために新しい色を作る。必要ならデザインに相談して追加",
            },
          ]}
        />
      </DocSection>

      <DocSection
        id="type"
        title={{ en: "Typography", ja: "文字" }}
        lead={{
          en: "Inter; Japanese falls back to the system font for now. text-base (18px) is the default. text-2xl and text-2xs are not defined yet; line height is not decided yet.",
          ja: "フォントは Inter（日本語は当面システムのフォント）。基本は text-base（18px）。text-2xl と text-2xs はまだ決まっていません。行の高さも未定です。",
        }}
      >
        <div className="flex flex-col divide-y divide-default overflow-hidden rounded-lg border border-default bg-default">
          {TYPE_SCALE.map((step) => (
            <div
              key={step.name}
              className="grid grid-cols-[9rem_4rem_minmax(0,1fr)_20rem] items-baseline gap-4 px-5 py-4"
            >
              <span className="font-mono text-sm font-bold">{step.name}</span>
              <span className="font-mono text-sm text-secondary">
                {step.px}
              </span>
              <span className={cn(step.className, "truncate font-bold")}>
                在庫 Stock 128
              </span>
              <span className="text-sm text-secondary">{tx(step.use)}</span>
            </div>
          ))}
        </div>
        <p className="text-base text-secondary">
          {tx({
            en: "Weights: Regular 400, Medium 500, Bold 700. Bold for titles, labels and anything tappable; regular for sentences. The display sizes (text-display…) predate this scale: do not use them in new screens.",
            ja: "太さ：Regular 400 / Medium 500 / Bold 700。見出し・ラベル・押せるものは太字、文章は通常。text-display などの大きな文字はこの段階より前のもので、新しい画面では使いません。",
          })}
        </p>
      </DocSection>

      <DocSection
        id="spacing"
        title={{ en: "Spacing", ja: "余白" }}
        lead={{
          en: "Use only these steps. Names follow the Tailwind scale, so spacing/4 = 16px = p-4.",
          ja: "この段階だけを使います。名前は Tailwind に合わせているので、spacing/4 = 16px = p-4 です。",
        }}
      >
        <div className="flex flex-col gap-2 rounded-lg border border-default bg-default p-5">
          {SPACING_STEPS.map((step) => (
            <div key={step} className="flex items-center gap-4">
              <span className="w-28 font-mono text-sm font-bold">
                spacing/{step}
              </span>
              <span className="w-16 font-mono text-sm text-secondary">
                {step * 4}px
              </span>
              <span className="w-36 font-mono text-sm text-secondary">
                p-{step}, gap-{step}
              </span>
              <span
                className="h-4 rounded-sm bg-primary"
                style={{ width: step * 4 }}
              />
            </div>
          ))}
        </div>
        <SubTitle>{{ en: "The usual rhythm", ja: "よく使う間隔" }}</SubTitle>
        <div className="flex flex-col gap-2">
          {SPACING_RHYTHM.map((item) => (
            <p key={item.step} className="flex gap-4 text-base">
              <span className="w-28 shrink-0 font-mono text-sm font-bold">
                {item.step}
              </span>
              <span className="text-secondary">{tx(item.use)}</span>
            </p>
          ))}
        </div>
      </DocSection>

      <DocSection
        id="shape"
        title={{ en: "Radius, border, shadow", ja: "角・線・影" }}
        lead={{
          en: "Corners grow with the size of the thing. Borders are 1px by default and 2px for focus, selected or emphasised. One shadow, for dialogs and panels.",
          ja: "角の丸みは、ものが大きいほど大きくします。線は基本1px、選択中・強調は2px。影はポップアップとパネル用のひとつだけです。",
        }}
      >
        <div className="flex flex-wrap gap-4">
          {RADII.map((radius) => (
            <div key={radius.name} className="flex w-40 flex-col gap-2">
              <div
                className={cn(
                  "h-20 border border-default bg-muted",
                  radius.className
                )}
              />
              <span className="font-mono text-sm font-bold">{radius.name}</span>
              <span className="font-mono text-xs text-secondary">
                {radius.px}
              </span>
              <span className="text-sm text-secondary">{tx(radius.use)}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex w-40 flex-col gap-2">
            <div className="h-20 rounded-md border border-strong bg-default" />
            <span className="font-mono text-sm font-bold">border (1px)</span>
            <span className="text-sm text-secondary">
              {tx({
                en: "Default border and divider",
                ja: "基本の枠と区切り線",
              })}
            </span>
          </div>
          <div className="flex w-40 flex-col gap-2">
            <div className="h-20 rounded-md border-2 border-primary-text bg-default" />
            <span className="font-mono text-sm font-bold">border-2 (2px)</span>
            <span className="text-sm text-secondary">
              {tx({
                en: "Focus, selected or emphasised border",
                ja: "選択中・強調の枠",
              })}
            </span>
          </div>
          <div className="flex w-40 flex-col gap-2">
            <div className="h-20 rounded-lg border-2 border-control bg-default" />
            <span className="font-mono text-sm font-bold">
              border-2 border-control
            </span>
            <span className="text-sm text-secondary">
              {tx({
                en: "v2: tappable cards (ChoiceCard)",
                ja: "v2：押せるカード（ChoiceCard）",
              })}
            </span>
          </div>
          <div className="flex w-40 flex-col gap-2">
            <div className="h-20 rounded-xl bg-default shadow-dialog" />
            <span className="font-mono text-sm font-bold">shadow-dialog</span>
            <span className="text-sm text-secondary">
              {tx({
                en: "Y 8, blur 32, black 16%. Dialogs and panels only",
                ja: "Y 8・ぼかし32・黒16%。ポップアップとパネルだけ",
              })}
            </span>
          </div>
        </div>
      </DocSection>
    </>
  )
}

/** Shows the token's real value, read from the page, so it never drifts. */
function ColourSwatch({ swatch }: { swatch: Swatch }) {
  const tx = useDocText()
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
        <span className="text-sm text-secondary">{tx(swatch.use)}</span>
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
