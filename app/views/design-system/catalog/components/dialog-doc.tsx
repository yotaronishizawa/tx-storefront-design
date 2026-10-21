import type { ReactNode } from "react"

import { CircleAlert, Info, TriangleAlert, X } from "lucide-react"

import { Button } from "~/core"
import { cn } from "~/utils/cn"

import { useDocText } from "./doc-lang"
import { DocSection, Example, SubTitle } from "./doc-parts"

/** A dialog drawn in place (not modal), to show the spec on the page. */
function DialogPreview({
  title,
  icon,
  close = true,
  wide = false,
  actions,
}: {
  title: string
  icon?: "error" | "info" | "warning"
  close?: boolean
  wide?: boolean
  actions?: ReactNode
}) {
  const Icon =
    icon === "error" ? CircleAlert : icon === "info" ? Info : TriangleAlert
  return (
    <div className="grid w-full place-items-center rounded-lg bg-overlay p-6">
      <div
        className={cn(
          "flex w-full flex-col gap-8 rounded-xl bg-default p-8 shadow-dialog",
          wide ? "max-w-3xl" : "max-w-lg"
        )}
      >
        <div className="flex items-start gap-3">
          {icon && (
            <Icon
              aria-hidden="true"
              className={cn(
                "mt-0.5 size-7 shrink-0",
                icon === "error"
                  ? "text-error"
                  : icon === "info"
                    ? "text-info"
                    : "text-warning"
              )}
            />
          )}
          <p className="flex-1 text-xl font-bold">{title}</p>
          {close && (
            <X aria-hidden="true" className="size-6 shrink-0 text-secondary" />
          )}
        </div>
        <div className="grid min-h-24 place-items-center rounded-md border border-dashed border-strong bg-subtle text-sm text-secondary">
          Content area
        </div>
        {actions}
      </div>
    </div>
  )
}

export function DialogDoc() {
  const tx = useDocText()
  return (
    <DocSection
      id="dialog"
      title="Dialog & Panel"
      lead={{
        en: "Two types. Dialog: short messages and decisions. Panel: long content, such as manuals and videos. The spec is decided (Ethan); the shared component is next, so build new dialogs to these rules.",
        ja: "種類は2つ。Dialog：短いメッセージと判断。Panel：マニュアルや動画などの長い内容。仕様は決まっています（Ethan）。共通部品はこれから作るので、新しいポップアップはこのルールどおりに作ってください。",
      }}
    >
      <SubTitle>{{ en: "Rules", ja: "ルール" }}</SubTitle>
      <ul className="flex max-w-4xl list-disc flex-col gap-2 ps-6 text-base">
        {(
          [
            {
              en: "Dialog width: 680 by default (w-170). 1040 (w-260) when the content is a grid or a list with images, or one row has more than 3 items, such as product search.",
              ja: "Dialog の幅：基本 680（w-170）。中身がグリッドや画像付きの一覧、1行に4つ以上並ぶ時（商品検索など）は 1040（w-260）。",
            },
            {
              en: "Panel width: screen width minus 40 on each side.",
              ja: "Panel の幅：画面の幅から左右40ずつ引いた幅。",
            },
            {
              en: "Maximum height: screen height minus 40 at the top and bottom. Longer content scrolls inside.",
              ja: "高さの上限：画面の高さから上下40ずつ引いた高さ。長い中身は内側でスクロール。",
            },
            {
              en: "The main action is on the left, cancel or the other action on the right: the Store App's existing convention, which staff already know. (The Components page says the opposite; confirming with Ethan.)",
              ja: "主な操作は左、キャンセルやもう一方の操作は右。今の Store App の決まりで、店員がもう慣れているため（Components のページは逆なので Ethan に確認中）。",
            },
            {
              en: "Every dialog and panel has the scrim (bg-overlay) behind it.",
              ja: "すべての Dialog と Panel の後ろには幕（bg-overlay）を敷く。",
            },
            {
              en: "Several blocks in the content: stack them with a gap of spacing/4 (16px).",
              ja: "中身が複数のブロックなら、spacing/4（16px）の間隔で縦に積む。",
            },
            {
              en: "Title text-xl bold, with an icon only for error, info or warning; close icon at the top right.",
              ja: "見出しは text-xl の太字。アイコンはエラー・情報・注意の時だけ。閉じる（×）は右上。",
            },
          ] as const
        ).map((rule) => (
          <RuleItem key={rule.en} rule={rule} />
        ))}
      </ul>
      <SubTitle>{{ en: "Fixed values", ja: "固定の値" }}</SubTitle>
      <p className="text-base text-secondary">
        {tx({
          en: "The same in every popup; nobody chooses them. Ethan drew them on the old 1920×1440 canvas (in brackets); the values here are for the 1180×820 screen.",
          ja: "どのポップアップでも同じで、選ぶものではありません。Ethan は旧 1920×1440 のキャンバスで決めています（括弧内）。ここの値は 1180×820 の画面用に直したものです。",
        })}
      </p>
      <FixedValues />
      <SubTitle>{{ en: "Kinds", ja: "使い分け" }}</SubTitle>
      <div className="grid grid-cols-2 gap-4">
        <Example
          label="Blocking"
          note={{
            en: "The app is busy and staff must wait. No buttons, no close icon. It closes by itself when the task ends.",
            ja: "アプリが処理中で、待つしかない時。ボタンも閉じるもなし。終わったら自動で閉じる。",
          }}
          code={"<Dialog …> title + content, no actions"}
        >
          <DialogPreview title="ロボットが動作中です" close={false} />
        </Example>
        <Example
          label="Info"
          note={{
            en: "Tells about a problem or a result. One button, full width. Close icon shown.",
            ja: "問題や結果を伝える。ボタンは1つで行いっぱい。閉じるあり。",
          }}
          code={"<Dialog …> icon + title + content + one primary"}
        >
          <DialogPreview
            title="スキャナーが接続されていません"
            icon="error"
            actions={
              <Button size="lg" className="w-full">
                再接続
              </Button>
            }
          />
        </Example>
        <Example
          label="Confirmation"
          note={{
            en: "Asks to confirm before an action. Primary on the left, secondary on the right.",
            ja: "操作の前に確認する。左に primary、右に secondary。",
          }}
          code={"<Dialog …> title + content + primary | secondary"}
        >
          <DialogPreview
            title="ロボットの運転を開始しますか"
            actions={
              <div className="grid grid-cols-2 gap-4">
                <Button size="lg">運転を開始</Button>
                <Button size="lg" variant="secondary">
                  キャンセル
                </Button>
              </div>
            }
          />
        </Example>
        <Example
          label="Destructive"
          note={{
            en: "Same as Confirmation, but the action cannot be undone: error icon and the Destructive button.",
            ja: "Confirmation と同じだが、取り消せない操作。エラーのアイコンと destructive のボタン。",
          }}
          code={
            "<Dialog …> error icon + title + content + destructive | secondary"
          }
        >
          <DialogPreview
            title="登録した棚割りを削除しますか"
            icon="error"
            actions={
              <div className="grid grid-cols-2 gap-4">
                <Button size="lg" variant="destructive">
                  削除する
                </Button>
                <Button size="lg" variant="secondary">
                  キャンセル
                </Button>
              </div>
            }
          />
        </Example>
      </div>
      <Example
        label={{
          en: "Wide dialog (1040) · Panel",
          ja: "広い Dialog（1040）・Panel",
        }}
        note={{
          en: "Wide: same parts as the 680 dialog, only wider (product search). Panel: same header, padding, radius and shadow, nearly full screen, content scrolls inside (help, manuals).",
          ja: "広い Dialog：680 と同じ部品で幅だけ広い（商品検索）。Panel：見出し・余白・角・影は同じで、ほぼ全画面。中身は内側でスクロール（ヘルプ、マニュアル）。",
        }}
        code={"<Dialog wide …> / <Panel …>"}
      >
        <DialogPreview
          title="商品検索"
          wide
          actions={
            <Button size="lg" className="w-full">
              閉じる
            </Button>
          }
        />
      </Example>
    </DocSection>
  )
}

function RuleItem({ rule }: { rule: { en: string; ja: string } }) {
  const tx = useDocText()
  return <li>{tx(rule)}</li>
}

const FIXED: {
  item: { en: string; ja: string }
  value: string
  unity: string
}[] = [
  {
    item: { en: "Scrim", ja: "幕" },
    value: "bg-overlay (black 30%)",
    unity: "black 30%",
  },
  {
    item: { en: "Container", ja: "器" },
    value: "bg-default, rounded-xl, shadow-dialog",
    unity: "white, radius 32",
  },
  { item: { en: "Padding", ja: "内側の余白" }, value: "p-8 · 32", unity: "48" },
  {
    item: { en: "Header icon", ja: "見出しのアイコン" },
    value: "size-8 · 32, gap-3 · 12, left of the title",
    unity: "56, gap 16",
  },
  {
    item: { en: "Title", ja: "見出し" },
    value: "text-xl · 24 bold, left aligned",
    unity: "40 bold",
  },
  {
    item: { en: "Title to body", ja: "見出しと本文の間" },
    value: "gap-8 · 32",
    unity: "48",
  },
  { item: { en: "Body text", ja: "本文" }, value: "text-lg · 20", unity: "32" },
  {
    item: { en: "Gap between content blocks", ja: "中身のブロックの間" },
    value: "gap-4 · 16",
    unity: "24",
  },
  {
    item: { en: "Content to actions", ja: "中身とボタンの間" },
    value: "gap-8 · 32",
    unity: "48",
  },
  {
    item: { en: "Button", ja: "ボタン" },
    value: 'Button size="lg" · 60, rounded-md, text-lg bold',
    unity: "100, radius 8, 32 bold",
  },
  {
    item: { en: "Button row", ja: "ボタンの並び" },
    value: "full width, split evenly, gap-4 · 16; never stacked",
    unity: "gap 24",
  },
  {
    item: { en: "Close icon", ja: "閉じる" },
    value: "24 icon in a 56 tap area, 16 from the top and right",
    unity: "40 in 88, 24 from edges",
  },
  {
    item: { en: "Width", ja: "幅" },
    value: "w-170 · 680 / w-260 · 1040",
    unity: "1128 / 1688",
  },
  {
    item: { en: "Panel", ja: "パネル" },
    value: "screen − 40 each side; max height screen − 40 top and bottom",
    unity: "1800, 60 margins",
  },
]

function FixedValues() {
  const tx = useDocText()
  return (
    <div className="overflow-hidden rounded-lg border border-default bg-default">
      <table className="w-full text-left text-sm">
        <thead className="bg-subtle text-secondary">
          <tr>
            <th className="px-4 py-2 font-bold">
              {tx({ en: "Item", ja: "項目" })}
            </th>
            <th className="px-4 py-2 font-bold">
              {tx({ en: "Value (1180×820)", ja: "値（1180×820）" })}
            </th>
            <th className="px-4 py-2 font-bold">
              {tx({ en: "Unity canvas", ja: "旧キャンバス" })}
            </th>
          </tr>
        </thead>
        <tbody>
          {FIXED.map((row) => (
            <tr key={row.item.en} className="border-t border-default align-top">
              <td className="px-4 py-2 font-bold">{tx(row.item)}</td>
              <td className="px-4 py-2 font-mono">{row.value}</td>
              <td className="px-4 py-2 font-mono text-secondary">
                {row.unity}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
