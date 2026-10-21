import { useState } from "react"

import { ToggleGroup } from "~/core"
import { cn } from "~/utils/cn"
import { readStorage, writeStorage } from "~/utils/local-storage"

import { ButtonDoc } from "./components/button-doc"
import { ChoiceCardDoc } from "./components/choice-card-doc"
import { DialogDoc } from "./components/dialog-doc"
import {
  DocLangProvider,
  useDocText,
  type DocLang,
  type DocText,
} from "./components/doc-lang"
import { DocSection } from "./components/doc-parts"
import { Foundations } from "./components/foundations"
import { NoticeDoc } from "./components/notice-doc"
import { RadioCardDoc } from "./components/radio-card-doc"
import { SearchFieldDoc } from "./components/search-field-doc"
import { StatusListDoc } from "./components/status-list-doc"
import { SupportContactDoc } from "./components/support-contact-doc"

const LANG_KEY = "storeApp.designSystem.lang"

const NAV: { title: DocText; items: { id: string; label: DocText }[] }[] = [
  {
    title: { en: "Start here", ja: "はじめに" },
    items: [
      { id: "how-to-use", label: { en: "How to use this", ja: "使い方" } },
    ],
  },
  {
    title: { en: "Foundations", ja: "基本" },
    items: [
      { id: "ui-size", label: { en: "Screen size", ja: "画面サイズ" } },
      { id: "colour", label: { en: "Colour", ja: "色" } },
      { id: "type", label: { en: "Typography", ja: "文字" } },
      { id: "spacing", label: { en: "Spacing", ja: "余白" } },
      {
        id: "shape",
        label: { en: "Radius, border, shadow", ja: "角・線・影" },
      },
    ],
  },
  {
    title: { en: "Components", ja: "部品" },
    items: [
      { id: "button", label: "Button" },
      { id: "dialog", label: "Dialog & Panel" },
      { id: "choice-card", label: "ChoiceCard" },
      { id: "notice", label: "Notice" },
      { id: "support-contact", label: "SupportContact" },
      { id: "search-field", label: "SearchField" },
      { id: "radio-card", label: "RadioCardGroup" },
      { id: "status-list", label: "StatusList" },
    ],
  },
  {
    title: { en: "Next", ja: "これから" },
    items: [
      { id: "coming-next", label: { en: "Coming next", ja: "追加予定" } },
    ],
  },
]

const PRINCIPLES: { title: DocText; body: DocText }[] = [
  {
    title: { en: "Look here first", ja: "まずここを探す" },
    body: {
      en: "Before drawing or coding anything, find the piece whose 'Use it when' matches what you need.",
      ja: "描いたり書いたりする前に、「使う時」が今の目的に合う部品を探します。",
    },
  },
  {
    title: { en: "Use it as it is", ja: "そのまま使う" },
    body: {
      en: "Pick a variant; don't restyle it with your own classes. A near-copy is how two looks for one job start.",
      ja: "種類（variant）から選び、自分のクラスで見た目を変えません。少しだけ違うコピーが、同じ役割の見た目違いの始まりです。",
    },
  },
  {
    title: { en: "Nothing fits? Ask", ja: "合わなければ相談" },
    body: {
      en: "Talk to design before building a new piece. Once agreed, it is added here so the next person finds it.",
      ja: "新しい部品を作る前にデザインに相談します。決まったらここに追加して、次の人が見つけられるようにします。",
    },
  },
]

/** Pieces found in the inventory that are still built several ways. */
const COMING_NEXT: { name: string; what: DocText }[] = [
  {
    name: "IconButton",
    what: {
      en: "Round and square icon-only buttons in three sizes",
      ja: "丸と四角のアイコンだけのボタン（3サイズ）",
    },
  },
  {
    name: "PillButton",
    what: { en: "The header's rounded buttons", ja: "ヘッダーの丸いボタン" },
  },
  {
    name: "StatusPill / Badge",
    what: {
      en: "Robot status, in progress, unsent changes",
      ja: "ロボットの状態、作業中、未送信の変更",
    },
  },
  {
    name: "SectionHeading / PageHeader",
    what: {
      en: "Titles with the yellow bar, and page headers",
      ja: "黄色い線の見出し、画面の見出し",
    },
  },
  {
    name: "SegmentedControl / NavList",
    what: {
      en: "Tabs, toggles and side navigation",
      ja: "タブ、切り替え、横のメニュー",
    },
  },
  {
    name: "EmptyState / Loading",
    what: {
      en: "Nothing here yet, and waiting",
      ja: "まだ何もない時、待っている時",
    },
  },
  {
    name: "StepList / Figure",
    what: {
      en: "Numbered steps, and pictures with a caption",
      ja: "番号付きの手順、説明付きの画像",
    },
  },
]

/** Stored choice first, then the browser's language. */
function initialLang(): DocLang {
  const stored = readStorage(LANG_KEY)
  if (stored === "en" || stored === "ja") return stored
  return typeof navigator !== "undefined" && navigator.language.startsWith("ja")
    ? "ja"
    : "en"
}

/**
 * StoreApp v2's design system, on one page: the tokens and the components to
 * build screens from, each with when to use it, live examples and its props.
 * Open at /design-system; no sign-in needed. English or Japanese.
 */
export function CatalogView() {
  const [lang, setLang] = useState<DocLang>(initialLang)
  return (
    <DocLangProvider lang={lang}>
      <Catalog
        lang={lang}
        onLang={(next) => {
          setLang(next)
          writeStorage(LANG_KEY, next)
        }}
      />
    </DocLangProvider>
  )
}

function Catalog({
  lang,
  onLang,
}: {
  lang: DocLang
  onLang: (lang: DocLang) => void
}) {
  const tx = useDocText()
  return (
    <div className="grid h-svh grid-cols-[16rem_minmax(0,1fr)] bg-subtle text-primary">
      <nav className="flex flex-col gap-6 overflow-y-auto border-e border-default bg-default p-6">
        <div className="flex flex-col gap-1">
          <p className="text-xl font-bold">StoreApp v2</p>
          <p className="text-base text-secondary">
            {tx({ en: "Design system", ja: "デザインシステム" })}
          </p>
        </div>
        {/* The catalog's own language, apart from the app's. */}
        <ToggleGroup
          className="grid grid-cols-2 gap-1 rounded-lg bg-subtle p-1"
          itemClassName={(selected) =>
            cn(
              "min-h-10 rounded-md text-sm font-bold",
              selected
                ? "bg-default shadow-dialog"
                : "text-secondary active:bg-muted"
            )
          }
          options={[
            { value: "ja", label: "日本語" },
            { value: "en", label: "English" },
          ]}
          value={lang}
          onValueChange={(value) => onLang(value === "en" ? "en" : "ja")}
        />
        {NAV.map((group) => (
          <div key={tx(group.title)} className="flex flex-col gap-1">
            <p className="px-3 text-sm font-bold text-secondary">
              {tx(group.title)}
            </p>
            {group.items.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="rounded-md px-3 py-2 text-base active:bg-subtle"
              >
                {tx(item.label)}
              </a>
            ))}
          </div>
        ))}
      </nav>

      <main className="overflow-y-auto">
        <div className="mx-auto flex max-w-6xl flex-col gap-20 px-10 py-12">
          <DocSection
            id="how-to-use"
            title={{ en: "How to use this", ja: "使い方" }}
            lead={{
              en: "Every screen of StoreApp v2 is built from the pieces on this page. Simple screens can be designed and built from here without a designer; the point is that the app keeps one look and one way of working, not a patchwork of near-copies.",
              ja: "StoreApp v2 の画面は、すべてこのページの部品で組み立てます。簡単な画面なら、デザイナーがいなくてもここから設計・実装できます。目的は、少しずつ違うコピーの継ぎはぎではなく、アプリ全体でひとつの見た目と使い方を保つことです。",
            }}
          >
            <ol className="grid grid-cols-3 gap-4">
              {PRINCIPLES.map((step, index) => (
                <li
                  key={tx(step.title)}
                  className="flex flex-col gap-2 rounded-lg bg-default p-5"
                >
                  <span className="grid size-8 place-items-center rounded-full bg-inverse text-base font-bold text-inverse">
                    {index + 1}
                  </span>
                  <span className="text-lg font-bold">{tx(step.title)}</span>
                  <span className="text-base text-secondary">
                    {tx(step.body)}
                  </span>
                </li>
              ))}
            </ol>
          </DocSection>

          <Foundations />

          <ButtonDoc />
          <DialogDoc />
          <ChoiceCardDoc />
          <NoticeDoc />
          <SupportContactDoc />
          <SearchFieldDoc />
          <RadioCardDoc />
          <StatusListDoc />

          <DocSection
            id="coming-next"
            title={{ en: "Coming next", ja: "追加予定" }}
            lead={{
              en: "Still built several ways in the app today (see docs/design-system/inventory.md). Until they land here, copy the closest existing use and tell design.",
              ja: "アプリの中で、まだ何通りもの作り方が混ざっている部品です（docs/design-system/inventory.md）。ここに載るまでは、一番近い既存の使い方をまねて、デザインに知らせてください。",
            }}
          >
            <div className="grid grid-cols-3 gap-3">
              {COMING_NEXT.map((item) => (
                <div
                  key={item.name}
                  className="flex flex-col gap-1 rounded-lg border border-dashed border-strong bg-default p-4"
                >
                  <span className="font-bold">{item.name}</span>
                  <span className="text-sm text-secondary">
                    {tx(item.what)}
                  </span>
                </div>
              ))}
            </div>
          </DocSection>
        </div>
      </main>
    </div>
  )
}
