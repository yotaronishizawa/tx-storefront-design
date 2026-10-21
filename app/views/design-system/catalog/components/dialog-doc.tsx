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
          "flex w-full flex-col gap-4 rounded-xl bg-default p-8 shadow-dialog",
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
              en: "The main action is on the right. Cancel or the other action is on the left.",
              ja: "主な操作は右。キャンセルやもう一方の操作は左。",
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
            en: "Asks to confirm before an action. Secondary on the left, primary on the right.",
            ja: "操作の前に確認する。左に secondary、右に primary。",
          }}
          code={"<Dialog …> title + content + secondary | primary"}
        >
          <DialogPreview
            title="ロボットの運転を開始しますか"
            actions={
              <div className="grid grid-cols-2 gap-4">
                <Button size="lg" variant="secondary">
                  キャンセル
                </Button>
                <Button size="lg">運転を開始</Button>
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
            "<Dialog …> error icon + title + content + secondary | destructive"
          }
        >
          <DialogPreview
            title="登録した棚割りを削除しますか"
            icon="error"
            actions={
              <div className="grid grid-cols-2 gap-4">
                <Button size="lg" variant="secondary">
                  キャンセル
                </Button>
                <Button size="lg" variant="destructive">
                  削除する
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
