import { useState } from "react"

import { RadioCardGroup } from "~/core"

import { DocSection, Example, PropsTable, UseWhen } from "./doc-parts"

export function RadioCardDoc() {
  const [value, setValue] = useState("today")
  return (
    <DocSection
      id="radio-card"
      title="RadioCardGroup"
      lead={{
        en: "Pick one of a few options, each a card with a title and a line under it (Ethan's Rich Radio Group). The chosen card turns orange. Choosing does nothing by itself; a Button confirms it.",
        ja: "いくつかの中からひとつを選ぶ。選択肢はそれぞれ、見出しと下の1行のカード（Ethan の Rich Radio Group）。選んだカードはオレンジになります。選んだだけでは何も起きず、Button で確定します。",
      }}
      importLine={'import { RadioCardGroup } from "~/core"'}
    >
      <UseWhen
        dos={[
          {
            en: "2–4 options inside a dialog or a form, confirmed with a Button",
            ja: "ポップアップやフォームの中の2〜4個の選択肢（Button で確定）",
          },
          {
            en: "Options that need a line of explanation each",
            ja: "それぞれに1行の説明が要る選択肢",
          },
        ]}
        donts={[
          {
            en: "Choosing where to go next, with no confirm step: that is a ChoiceCard",
            ja: "確定なしでそのまま次へ進む選択 → ChoiceCard",
          },
          {
            en: "Switching a view (tabs, before/after): that is a segmented control",
            ja: "表示の切り替え（タブ、前後の比較）→ 切り替えボタン",
          },
        ]}
      />
      <Example
        label={{ en: "Tap a card to try it", ja: "カードを押して試せます" }}
        code={`<RadioCardGroup
  label="陳列する日"
  value={day}
  onValueChange={setDay}
  options={[
    { value: "today", label: "今日", description: "このあとすぐ陳列します" },
    { value: "tomorrow", label: "明日", description: "明日の朝に陳列します" },
  ]}
/>`}
      >
        <RadioCardGroup
          className="w-full max-w-2xl"
          label="陳列する日"
          value={value}
          onValueChange={setValue}
          options={[
            {
              value: "today",
              label: "今日",
              description: "このあとすぐ陳列します",
            },
            {
              value: "tomorrow",
              label: "明日",
              description: "明日の朝に陳列します",
            },
          ]}
        />
      </Example>
      <PropsTable
        rows={[
          {
            name: "options",
            type: "{ value, label, description?, disabled? }[]",
            description: {
              en: "The cards, in order.",
              ja: "カード（並び順のまま）。",
            },
          },
          {
            name: "value",
            type: "string",
            description: { en: "The chosen option.", ja: "選ばれている値。" },
          },
          {
            name: "onValueChange",
            type: "(value: string) => void",
            description: {
              en: "Called when another card is chosen.",
              ja: "別のカードを選んだ時に呼ばれる。",
            },
          },
          {
            name: "label",
            type: "string",
            description: {
              en: "What is being chosen, for screen readers.",
              ja: "何を選ぶのか（読み上げ用）。",
            },
          },
        ]}
      />
    </DocSection>
  )
}
