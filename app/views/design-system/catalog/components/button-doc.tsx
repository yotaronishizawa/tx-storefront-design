import { RotateCcw } from "lucide-react"

import { Button } from "~/core"

import { DocSection, Example, PropsTable, UseWhen } from "./doc-parts"

export function ButtonDoc() {
  return (
    <DocSection
      id="button"
      title="Button"
      lead={{
        en: "An action: it does something now. Three types, three states (default, pressed, disabled; no hover or focus, because the iPad uses touch) and one size: 60px high. Width follows the layout; in dialogs, buttons fill the row.",
        ja: "操作。押すとその場で何かが起きるもの。種類は3つ、状態は3つ（通常・押している・押せない。iPad はタッチなのでホバーとフォーカスはなし）、大きさはひとつ（高さ60px）。幅はレイアウトに合わせ、ポップアップの中では行いっぱいに広げます。",
      }}
      importLine={'import { Button } from "~/core"'}
    >
      <UseWhen
        dos={[
          {
            en: "Primary: the main action. One per screen or dialog",
            ja: "primary：主な操作。1画面・1ポップアップにひとつ",
          },
          {
            en: "Secondary: cancel or any other action",
            ja: "secondary：キャンセルやその他の操作",
          },
          {
            en: "Destructive: delete, stop, or anything that cannot be undone",
            ja: "destructive：削除・停止など、取り消せない操作",
          },
        ]}
        donts={[
          {
            en: "Choosing where to go or what to do next: that is a ChoiceCard",
            ja: "次にどこへ行くか・何をするかを選ぶもの → ChoiceCard",
          },
          {
            en: 'variant="unstyled" with your own classes: if no variant fits, ask design',
            ja: 'variant="unstyled" に自分でクラスを書く（合う種類がなければデザインに相談）',
          },
          {
            en: 'size="sm" or "md" in new screens: they remain only in screens carried over from v1',
            ja: '新しい画面で size="sm"・"md" を使う（v1 から引き継いだ画面にだけ残っている）',
          },
        ]}
      />
      <Example
        label="primary · secondary · destructive"
        note={{
          en: 'size="lg" is the design system\'s 60px button. Press and hold to see the pressed state.',
          ja: 'size="lg" がデザインシステムの60pxのボタン。押し続けると「押している」状態が見られます。',
        }}
        code={`<Button size="lg">実行する</Button>
<Button size="lg" variant="secondary">キャンセル</Button>
<Button size="lg" variant="destructive">削除する</Button>
<Button size="lg" disabled>実行する</Button>`}
      >
        <div className="grid w-full max-w-3xl grid-cols-4 gap-3">
          <Button size="lg">実行する</Button>
          <Button size="lg" variant="secondary">
            キャンセル
          </Button>
          <Button size="lg" variant="destructive">
            削除する
          </Button>
          <Button size="lg" disabled>
            実行する
          </Button>
        </div>
      </Example>
      <Example
        label={{ en: "With an icon, busy", ja: "アイコン付き、待機中" }}
        note={{
          en: "busy while waiting for the robot or the server: it disables the button and spins in place of the icon.",
          ja: "ロボットやサーバーを待つ間は busy。押せなくなり、アイコンの代わりにくるくるが回ります。",
        }}
        code={`<Button size="lg" icon={<RotateCcw />}>もう一度試す</Button>
<Button size="lg" busy>送信中</Button>`}
      >
        <div className="grid w-full max-w-xl grid-cols-2 gap-3">
          <Button size="lg" icon={<RotateCcw />}>
            もう一度試す
          </Button>
          <Button size="lg" busy>
            送信中
          </Button>
        </div>
      </Example>
      <PropsTable
        rows={[
          {
            name: "variant",
            type: '"primary" | "secondary" | "destructive"',
            defaultValue: '"primary"',
            description: {
              en: "What kind of action it is.",
              ja: "操作の種類。",
            },
          },
          {
            name: "size",
            type: '"lg" (| "sm" | "md")',
            defaultValue: '"md"',
            description: {
              en: "Use lg (60px). sm and md are legacy.",
              ja: "lg（60px）を使う。sm・md は旧画面用。",
            },
          },
          {
            name: "icon",
            type: "ReactNode",
            description: {
              en: "Shown before the label.",
              ja: "ラベルの前に出すアイコン。",
            },
          },
          {
            name: "busy",
            type: "boolean",
            defaultValue: "false",
            description: {
              en: "Disables it and shows a spinner in place of the icon.",
              ja: "押せなくして、アイコンの代わりにくるくるを出す。",
            },
          },
        ]}
      />
    </DocSection>
  )
}
