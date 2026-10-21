import { useState } from "react"

import { SearchField } from "~/core"

import { DocSection, Example, PropsTable, UseWhen } from "./doc-parts"

export function SearchFieldDoc() {
  const [value, setValue] = useState("")
  return (
    <DocSection
      id="search-field"
      title="SearchField"
      lead={{
        en: "The one search box (Ethan's Input search): a search icon, the text, and a clear button once something is typed. Results update as staff type; there is no search button.",
        ja: "検索欄はこれひとつ（Ethan の Input search）。虫眼鏡、入力欄、入力すると出る消すボタン。打つたびに結果が変わるので、検索ボタンはありません。",
      }}
      importLine={'import { SearchField } from "~/core"'}
    >
      <UseWhen
        dos={[
          {
            en: "Finding an item in a long list: products, videos, manual pages",
            ja: "長い一覧から探す：商品、動画、マニュアルのページ",
          },
          {
            en: "A placeholder that says what can be searched, with an example",
            ja: "何を探せるかを例つきで書いたプレースホルダー",
          },
        ]}
        donts={[
          {
            en: "Entering a value to save (a count, a name): that is a form field",
            ja: "保存する値の入力（本数、名前）→ 入力欄（フォーム）",
          },
          {
            en: "A round or differently bordered search box for one screen",
            ja: "1画面だけ丸い・枠の違う検索欄",
          },
        ]}
      />
      <Example
        label={{ en: "Type to try it", ja: "入力して試せます" }}
        code={`<SearchField
  value={query}
  onValueChange={setQuery}
  placeholder="動画とマニュアルを検索（例：補充、スキャン）"
  clearLabel="検索をクリア"
/>`}
      >
        <SearchField
          className="w-full max-w-xl"
          value={value}
          onValueChange={setValue}
          placeholder="動画とマニュアルを検索（例：補充、スキャン）"
          clearLabel="検索をクリア"
        />
      </Example>
      <PropsTable
        rows={[
          {
            name: "value",
            type: "string",
            description: { en: "What is typed.", ja: "入力中の文字。" },
          },
          {
            name: "onValueChange",
            type: "(value: string) => void",
            description: {
              en: "Called on every keystroke and on clear.",
              ja: "入力のたびと消した時に呼ばれる。",
            },
          },
          {
            name: "placeholder",
            type: "string",
            description: {
              en: "What can be searched, with an example. Also its accessible name.",
              ja: "何を探せるか（例つき）。読み上げの名前にもなる。",
            },
          },
          {
            name: "clearLabel",
            type: "string",
            description: {
              en: "Accessible name of the clear button.",
              ja: "消すボタンの読み上げの名前。",
            },
          },
        ]}
      />
    </DocSection>
  )
}
