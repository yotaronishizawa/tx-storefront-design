import { useDocText } from "./doc-lang"
import { SubTitle } from "./doc-parts"

/** How the words in a popup are written: decided once, not per popup. */
const WRITING: {
  rule: { en: string; ja: string }
  example?: { en: string; ja: string }
}[] = [
  {
    rule: {
      en: "Title: what is happening or what is asked, in one sentence. Never put the question in the first line of the body.",
      ja: "見出し：何が起きているか・何を聞いているかを1文で。質問を本文の1行目に書かない。",
    },
    example: {
      en: "Title “Start the robot displaying drinks?”, body “To start, make sure…”",
      ja: "見出し「ロボットによる陳列を開始しますか？」、本文「開始させる場合、…」",
    },
  },
  {
    rule: {
      en: "Body: the reason, the condition, or what to do next. No line breaks in the middle of a sentence; let it wrap.",
      ja: "本文：理由・条件・次にすること。文の途中で改行しない（自然に折り返す）。",
    },
  },
  {
    rule: {
      en: "Main button: the name of the action, a verb. Never Yes or OK. When the body refers to the button, use the same words.",
      ja: "主なボタン：操作の名前（動詞）。「はい」「OK」は使わない。本文でボタンに触れる時は同じ言葉を使う。",
    },
    example: {
      en: "“Start” and “press Start from outside the walk-in”; “Stop the robot”",
      ja: "「開始する」と「ウォークインの外で『開始する』を押してください」、「ロボットを止める」",
    },
  },
  {
    rule: {
      en: "The other button is Cancel, never No. A popup that only tells a result has Close (or one action) instead.",
      ja: "もう一方のボタンは「キャンセル」。「いいえ」は使わない。結果を伝えるだけのものは「閉じる」（か操作がひとつ）。",
    },
  },
  {
    rule: {
      en: "No “are you sure?” in front of an action that can be undone. Ask only for safety (is anyone in the walk-in?) or when it cannot be undone. Put the explanation where it is read before pressing: right above the button.",
      ja: "取り消せる操作の前に「本当に〜しますか？」を挟まない。聞くのは安全のため（中に人がいないか）か、取り消せない時だけ。説明は押す前に読める場所、ボタンのすぐ上に置く。",
    },
    example: {
      en: "Robot power popup: the note on what stops the robot sits above “Stop the robot”, with no second question.",
      ja: "ロボット電源：「押すとロボットが止まります…」の注釈を「ロボットを止める」の上に置き、2回目の確認はしない。",
    },
  },
  {
    rule: {
      en: "The words do not change with time or progress. They change only when the state itself changes (stopped, failed).",
      ja: "経過時間や進み具合で文言を変えない。変えるのは状態そのものが変わった時（止まった・失敗した）だけ。",
    },
  },
  {
    rule: {
      en: "A phone number (SupportContact) only when calling is the next thing to do. Never in a popup that only waits.",
      ja: "電話番号（SupportContact）は、連絡することが次の行動の時だけ。待つだけのポップアップには出さない。",
    },
  },
]

export function DialogWriting() {
  const tx = useDocText()
  return (
    <>
      <SubTitle>{{ en: "Writing", ja: "文言" }}</SubTitle>
      <ul className="flex max-w-4xl list-disc flex-col gap-3 ps-6 text-base">
        {WRITING.map(({ rule, example }) => (
          <li key={rule.en}>
            {tx(rule)}
            {example && (
              <span className="block text-sm text-secondary">
                {tx(example)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </>
  )
}
