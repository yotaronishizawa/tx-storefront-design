import { SupportContact } from "~/components/support/support-contact"

import { DocSection, Example, PropsTable, UseWhen } from "./doc-parts"

export function SupportContactDoc() {
  return (
    <DocSection
      id="support-contact"
      title="SupportContact"
      lead={{
        en: "The way out when the screen cannot help: the operations centre's number, tappable. One look everywhere, so staff learn where to find it.",
        ja: "画面で解決できない時の出口：オペレーションセンターの番号（タップで発信）。どこでも同じ見た目にして、店員が探す場所を覚えられるようにします。",
      }}
      importLine={
        'import { SupportContact } from "~/components/support/support-contact"'
      }
    >
      <UseWhen
        dos={[
          {
            en: "Under a problem staff may not be able to fix (card, with a heading)",
            ja: "店員が直せないかもしれない問題の下（card、見出し付き）",
          },
          {
            en: "At the foot of help pages (strip)",
            ja: "ヘルプの下（strip）",
          },
        ]}
        donts={[
          {
            en: "The number written inside a sentence: it cannot be tapped",
            ja: "文章の中に番号を書く（タップできない）",
          },
          { en: "More than one on a screen", ja: "1画面に2つ以上置く" },
        ]}
      />
      <Example
        label={{
          en: "card with heading · card · strip",
          ja: "見出し付き card · card · strip",
        }}
        note={{
          en: "The heading says when to call; the message says what to tell them or why.",
          ja: "見出しは「いつ電話するか」、メッセージは「何を伝えるか・なぜ電話するか」。",
        }}
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
            description: {
              en: "Card under a problem; strip at the foot of help.",
              ja: "card は問題の下、strip はヘルプの下。",
            },
          },
          {
            name: "heading",
            type: "string",
            description: {
              en: "When to call. Card only.",
              ja: "いつ電話するか。card のみ。",
            },
          },
          {
            name: "message",
            type: "string",
            description: {
              en: "What to say, or why to call.",
              ja: "何を伝えるか、なぜ電話するか。",
            },
          },
        ]}
      />
    </DocSection>
  )
}
