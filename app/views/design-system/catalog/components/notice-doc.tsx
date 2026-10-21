import { Button, Notice } from "~/core"

import { DocSection, Example, PropsTable, SubTitle, UseWhen } from "./doc-parts"

export function NoticeDoc() {
  return (
    <DocSection
      id="notice"
      title="Notice"
      lead={{
        en: "Tells staff the state of things where they are looking. Near-black text on a tinted background; the icon carries the tone.",
        ja: "店員が見ているその場所で、今の状態を伝えるもの。薄い色の地に黒に近い文字。意味（色）はアイコンで伝えます。",
      }}
      importLine={'import { Notice } from "~/core"'}
    >
      <UseWhen
        dos={[
          {
            en: "Progress of something staff wait for: ロボットを止めています",
            ja: "店員が待っていることの進み具合：ロボットを止めています",
          },
          {
            en: "Why something is not possible right now",
            ja: "今それができない理由",
          },
          {
            en: "A warning before an action, next to it",
            ja: "操作の前の注意（その操作の近くに）",
          },
        ]}
        donts={[
          {
            en: "A decision staff must make: that is a Dialog",
            ja: "店員が決めなければいけないこと → ポップアップ（Dialog）",
          },
          {
            en: "A passing confirmation (saved, sent): that is a Toast",
            ja: "一瞬の確認（保存した、送信した）→ Toast",
          },
          { en: "Coloured text without a background", ja: "地のない色文字" },
        ]}
      />
      <SubTitle>{{ en: "Tones", ja: "トーン" }}</SubTitle>
      <Example
        label="neutral · info · success · warning · error"
        note={{
          en: "Pick the tone by meaning. Error only when something failed or the robot cannot move.",
          ja: "トーンは意味で選ぶ。error は失敗した時・ロボットが動けない時だけ。",
        }}
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
      <SubTitle>
        {{ en: "Title, action, outline", ja: "見出し・操作・枠付き" }}
      </SubTitle>
      <Example
        label={'title + detail · action · emphasis="outline"'}
        note={{
          en: "A title makes the children read as detail. One small action at the end at most. Outline only for what must not be missed.",
          ja: "title を付けると、中身はその詳細として読まれる。操作は最後に小さく1つまで。outline は見逃してはいけないものだけ。",
        }}
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
            description: {
              en: "Meaning, shown by the tint and the icon.",
              ja: "意味。地の色とアイコンで伝わる。",
            },
          },
          {
            name: "emphasis",
            type: '"subtle" | "outline"',
            defaultValue: '"subtle"',
            description: {
              en: "Outline adds the tone's border.",
              ja: "outline はトーンの色の枠を足す。",
            },
          },
          {
            name: "title",
            type: "ReactNode",
            description: {
              en: "Bold first line; children become its detail.",
              ja: "太字の1行目。中身はその詳細になる。",
            },
          },
          {
            name: "action",
            type: "ReactNode",
            description: {
              en: "One small button at the end.",
              ja: "最後に置く小さなボタン1つ。",
            },
          },
          {
            name: "icon",
            type: "LucideIcon | false",
            description: {
              en: "Replace the tone's icon, or hide it.",
              ja: "トーンのアイコンを替える、または消す。",
            },
          },
          {
            name: "role",
            type: '"status" | "alert"',
            defaultValue: '"status"',
            description: {
              en: "alert only when it appears because something just went wrong.",
              ja: "alert は今まさに何かが失敗して出る時だけ。",
            },
          },
        ]}
      />
    </DocSection>
  )
}
