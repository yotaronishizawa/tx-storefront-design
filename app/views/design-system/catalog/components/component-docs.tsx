import { BookOpen, Ellipsis, Play, RotateCcw } from "lucide-react"

import { SupportContact } from "~/components/support/support-contact"
import { Button, ChoiceCard, Notice } from "~/core"

import { DocSection, Example, PropsTable, SubTitle, UseWhen } from "./doc-parts"

const ENTER_ICON = "/assets/home-study-2026-10-06/enter.svg"

export function ButtonDoc() {
  return (
    <DocSection
      id="button"
      title="Button"
      lead="An action: it does something now (start, send, close, try again). A screen has at most one primary button; everything else is secondary."
      importLine={'import { Button } from "~/core"'}
    >
      <UseWhen
        dos={[
          "Doing something: 開始する, もう一度試す, 閉じる",
          "The answer of a dialog",
          'size="lg" with w-full for the one action at the foot of a panel',
        ]}
        donts={[
          "Choosing where to go or what to do next: that is a ChoiceCard",
          'variant="unstyled" with your own classes: if no variant fits, ask design',
          "Two primary buttons side by side",
        ]}
      />
      <SubTitle>Variants</SubTitle>
      <Example
        label="primary · secondary · destructive"
        note="Primary is the main action. Secondary is anything else, including Cancel and Close. Destructive only for removing or discarding."
        code={`<Button>開始する</Button>
<Button variant="secondary">キャンセル</Button>
<Button variant="destructive">削除する</Button>`}
      >
        <Button>開始する</Button>
        <Button variant="secondary">キャンセル</Button>
        <Button variant="destructive">削除する</Button>
      </Example>
      <SubTitle>Sizes and states</SubTitle>
      <Example
        label="sm · md · lg, with an icon, busy, disabled"
        note="md by default. lg for the main action of a panel or popup. busy while waiting for the robot or the server."
        code={`<Button size="sm">sm</Button>
<Button size="lg" icon={<RotateCcw />}>もう一度試す</Button>
<Button busy>送信中</Button>
<Button disabled>できません</Button>`}
      >
        <Button size="sm">sm</Button>
        <Button>md</Button>
        <Button size="lg" icon={<RotateCcw />}>
          もう一度試す
        </Button>
        <Button busy>送信中</Button>
        <Button disabled>できません</Button>
      </Example>
      <PropsTable
        rows={[
          {
            name: "variant",
            type: '"primary" | "secondary" | "destructive"',
            defaultValue: '"primary"',
            description: "What kind of action it is.",
          },
          {
            name: "size",
            type: '"sm" | "md" | "lg"',
            defaultValue: '"md"',
            description: "Height 40 / 48 / 56px.",
          },
          {
            name: "icon",
            type: "ReactNode",
            description: "Shown before the label.",
          },
          {
            name: "busy",
            type: "boolean",
            defaultValue: "false",
            description:
              "Disables it and shows a spinner in place of the icon.",
          },
        ]}
      />
    </DocSection>
  )
}

export function ChoiceCardDoc() {
  return (
    <DocSection
      id="choice-card"
      title="ChoiceCard"
      lead="A large card staff tap to choose what to do or where to go next. Same outline, corners and pressed colour everywhere, so anything that looks like this is tappable."
      importLine={'import { ChoiceCard } from "~/core"'}
    >
      <UseWhen
        dos={[
          "Entries on Home: ウォークインに入る, その他",
          "A few equal choices in a popup (tile)",
          "Items in a list that open something: a manual page, a video",
        ]}
        donts={[
          "Doing an action right away (send, start): that is a Button",
          "Showing information nobody taps: use a plain box with bg-subtle",
          "Restyling the outline or radius for one screen",
        ]}
      />
      <SubTitle>Row</SubTitle>
      <Example
        label={'layout="row" (default)'}
        note={
          'Icon, title, optional description. Add chevron when it opens more choices or another screen. size="sm" for longer lists.'
        }
        code={`<ChoiceCard icon={<img src={enterIcon} alt="" />} title="ウォークインに入る" />
<ChoiceCard icon={<Ellipsis />} title="その他"
  description="レイアウト変更・陳列予約・必要在庫本数登録" chevron />
<ChoiceCard size="sm" icon={<BookOpen />} title="補充の手順" description="24ページ" />`}
      >
        <div className="grid w-full max-w-2xl gap-3">
          <ChoiceCard
            icon={<img src={ENTER_ICON} alt="" className="h-7 w-auto" />}
            title="ウォークインに入る"
          />
          <ChoiceCard
            icon={<Ellipsis />}
            title="その他"
            description="レイアウト変更・陳列予約・必要在庫本数登録"
            chevron
          />
          <ChoiceCard
            size="sm"
            icon={<BookOpen />}
            title="補充の手順"
            description="24ページ"
          />
        </div>
      </Example>
      <SubTitle>Tile and media</SubTitle>
      <Example
        label={'layout="tile" · layout="media"'}
        note="Tiles for 2–4 equal choices in a grid. Media when a picture identifies the item (a video)."
        code={`<ChoiceCard layout="tile" icon={<img src={layoutIcon} alt="" />} title="レイアウト変更" />
<ChoiceCard layout="media" media={<Thumbnail />} title="補充のやり方" />`}
      >
        <div className="grid w-full max-w-3xl grid-cols-3 gap-4">
          <ChoiceCard
            layout="tile"
            icon={
              <img
                src="/assets/home-study-2026-10-06/layout.svg"
                alt=""
                className="h-9 w-auto"
              />
            }
            title="レイアウト変更"
          />
          <ChoiceCard
            layout="tile"
            icon={
              <img
                src="/assets/home-study-2026-10-06/reservation.svg"
                alt=""
                className="h-9 w-auto"
              />
            }
            title="陳列予約"
          />
          <ChoiceCard
            layout="media"
            title="補充のやり方"
            media={
              <span className="grid aspect-video w-full place-items-center bg-inverse">
                <span className="grid size-12 place-items-center rounded-full bg-default/90">
                  <Play
                    aria-hidden="true"
                    className="ms-0.5 size-6 fill-current"
                  />
                </span>
              </span>
            }
          />
        </div>
      </Example>
      <SubTitle>States</SubTitle>
      <Example
        label="selected · disabled"
        note="Selected for a choice that stays chosen (language). Disabled when the robot or a task does not allow it; say why nearby."
        code={`<ChoiceCard selected title="日本語" />
<ChoiceCard disabled title="ウォークインに入る" />`}
      >
        <div className="grid w-full max-w-2xl grid-cols-2 gap-3">
          <ChoiceCard selected title="日本語" description="Japanese" />
          <ChoiceCard
            disabled
            icon={<img src={ENTER_ICON} alt="" className="h-7 w-auto" />}
            title="ウォークインに入る"
          />
        </div>
      </Example>
      <PropsTable
        rows={[
          {
            name: "layout",
            type: '"row" | "tile" | "media"',
            defaultValue: '"row"',
            description:
              "Row: one line. Tile: icon over title in a grid. Media: picture on top.",
          },
          {
            name: "size",
            type: '"md" | "sm"',
            defaultValue: '"md"',
            description: "Rows only: 96px or 64px high.",
          },
          {
            name: "icon",
            type: "ReactNode",
            description: "Icon or small picture, in a grey square.",
          },
          {
            name: "title",
            type: "ReactNode",
            description: "What it is, in a few words.",
          },
          {
            name: "description",
            type: "ReactNode",
            description: "One line under the title.",
          },
          {
            name: "media",
            type: "ReactNode",
            description: "Media layout: the picture.",
          },
          {
            name: "chevron",
            type: "boolean",
            defaultValue: "false",
            description: "Rows only: it opens more choices or another screen.",
          },
          {
            name: "selected",
            type: "boolean",
            defaultValue: "false",
            description: "Stays chosen.",
          },
        ]}
      />
    </DocSection>
  )
}

export function NoticeDoc() {
  return (
    <DocSection
      id="notice"
      title="Notice"
      lead="Tells staff the state of things where they are looking. Near-black text on a tinted background; the icon carries the tone."
      importLine={'import { Notice } from "~/core"'}
    >
      <UseWhen
        dos={[
          "Progress of something staff wait for: ロボットを止めています",
          "Why something is not possible right now",
          "A warning before an action, next to it",
        ]}
        donts={[
          "A decision staff must make: that is a Dialog",
          "A passing confirmation (saved, sent): that is a Toast",
          "Coloured text without a background",
        ]}
      />
      <SubTitle>Tones</SubTitle>
      <Example
        label="neutral · info · success · warning · error"
        note="Pick the tone by meaning. Error only when something failed or the robot cannot move."
        code={`<Notice>ロボットを止めました。中に入って取り除いてください</Notice>
<Notice tone="info">オペレーターが対応予定です</Notice>
<Notice tone="success">送信しました</Notice>
<Notice tone="warning">賞味期限が近い在庫があります</Notice>
<Notice tone="error">まだロボットが動けません</Notice>`}
      >
        <div className="grid w-full max-w-2xl gap-3">
          <Notice>ロボットを止めました。中に入って取り除いてください</Notice>
          <Notice tone="info">オペレーターが対応予定です</Notice>
          <Notice tone="success">送信しました</Notice>
          <Notice tone="warning">賞味期限が近い在庫があります</Notice>
          <Notice tone="error">まだロボットが動けません</Notice>
        </div>
      </Example>
      <SubTitle>Title, action, outline</SubTitle>
      <Example
        label={'title + detail · action · emphasis="outline"'}
        note="A title makes the children read as detail. One small action at the end at most. Outline only for what must not be missed."
        code={`<Notice tone="warning" title="レイアウトが未送信です" action={<Button size="sm" variant="secondary">送信する</Button>}>
  変更は保存されていますが、ロボットにはまだ届いていません。
</Notice>
<Notice tone="error" emphasis="outline">非常停止ボタンが押されています</Notice>`}
      >
        <div className="grid w-full max-w-2xl gap-3">
          <Notice
            tone="warning"
            title="レイアウトが未送信です"
            action={
              <Button size="sm" variant="secondary">
                送信する
              </Button>
            }
          >
            変更は保存されていますが、ロボットにはまだ届いていません。
          </Notice>
          <Notice tone="error" emphasis="outline">
            非常停止ボタンが押されています
          </Notice>
        </div>
      </Example>
      <PropsTable
        rows={[
          {
            name: "tone",
            type: '"neutral" | "info" | "success" | "warning" | "error"',
            defaultValue: '"neutral"',
            description: "Meaning, shown by the tint and the icon.",
          },
          {
            name: "emphasis",
            type: '"subtle" | "outline"',
            defaultValue: '"subtle"',
            description: "Outline adds the tone's border.",
          },
          {
            name: "title",
            type: "ReactNode",
            description: "Bold first line; children become its detail.",
          },
          {
            name: "action",
            type: "ReactNode",
            description: "One small button at the end.",
          },
          {
            name: "icon",
            type: "LucideIcon | false",
            description: "Replace the tone's icon, or hide it.",
          },
          {
            name: "role",
            type: '"status" | "alert"',
            defaultValue: '"status"',
            description:
              "alert only when it appears because something just went wrong.",
          },
        ]}
      />
    </DocSection>
  )
}

export function SupportContactDoc() {
  return (
    <DocSection
      id="support-contact"
      title="SupportContact"
      lead="The way out when the screen cannot help: the operations centre's number, tappable. One look everywhere, so staff learn where to find it."
      importLine={
        'import { SupportContact } from "~/components/support/support-contact"'
      }
    >
      <UseWhen
        dos={[
          "Under a problem staff may not be able to fix (card, with a heading)",
          "At the foot of help pages (strip)",
        ]}
        donts={[
          "The number written inside a sentence: it cannot be tapped",
          "More than one on a screen",
        ]}
      />
      <Example
        label="card with heading · card · strip"
        note="The heading says when to call; the message says what to tell them or why."
        code={`<SupportContact heading="障害物が見当たらない場合"
  message="検知の誤作動の可能性があります。サポートまでご連絡ください。" />
<SupportContact message="動画やマニュアルで解決しない場合はお電話ください。" />
<SupportContact variant="strip" message="解決しないときはオペレーションセンターへ" />`}
      >
        <div className="grid w-full max-w-xl gap-6">
          <SupportContact
            heading="障害物が見当たらない場合"
            message="検知の誤作動の可能性があります。サポートまでご連絡ください。"
          />
          <SupportContact message="動画やマニュアルで解決しない場合はお電話ください。" />
          <SupportContact
            variant="strip"
            message="解決しないときはオペレーションセンターへ"
          />
        </div>
      </Example>
      <PropsTable
        rows={[
          {
            name: "variant",
            type: '"card" | "strip"',
            defaultValue: '"card"',
            description: "Card under a problem; strip at the foot of help.",
          },
          {
            name: "heading",
            type: "string",
            description: "When to call. Card only.",
          },
          {
            name: "message",
            type: "string",
            description: "What to say, or why to call.",
          },
        ]}
      />
    </DocSection>
  )
}
