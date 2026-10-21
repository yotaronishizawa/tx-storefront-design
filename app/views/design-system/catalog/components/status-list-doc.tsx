import { StatusList } from "~/core"

import { DocSection, Example, PropsTable, UseWhen } from "./doc-parts"

export function StatusListDoc() {
  return (
    <DocSection
      id="status-list"
      title="StatusList"
      lead={{
        en: "What the app is waiting for, one line per process. The words never change; only the icon does (pending, running, done, failed), so staff can read progress at a glance.",
        ja: "アプリが待っている処理を1行ずつ並べます。文言は変えず、アイコンだけが変わります（未着手・進行中・完了・失敗）。進み具合がひと目で分かります。",
      }}
      importLine={'import { StatusList } from "~/core"'}
    >
      <UseWhen
        dos={[
          {
            en: "Waiting on the robot or the shelves: the robot travelling to the stop position, shelf angles",
            ja: "ロボットや棚を待つ時：停止位置への移動、棚の角度調整",
          },
          {
            en: "Short labels that name the process, not the outcome",
            ja: "結果ではなく処理の名前を短く書く",
          },
        ]}
        donts={[
          {
            en: "Steps staff carry out themselves: that is a numbered step list",
            ja: "店員が自分でやる手順 → 番号付きの手順",
          },
          {
            en: 'Rewording a line as it progresses ("moving…" → "moved"): change the status instead',
            ja: "進行に合わせて文言を変える（「移動中」→「移動しました」）→ status を変える",
          },
        ]}
      />
      <Example
        label={{ en: "Every status", ja: "すべての状態" }}
        code={`<StatusList
  items={[
    { key: "robot", label: "ロボットを停止位置へ移動", status: "running" },
    { key: "shelves", label: "棚の角度を調整", status: "pending" },
  ]}
/>`}
        canvas="default"
      >
        <StatusList
          items={[
            { key: "pending", label: "pending", status: "pending" },
            { key: "running", label: "running", status: "running" },
            { key: "done", label: "done", status: "done" },
            { key: "failed", label: "failed", status: "failed" },
          ]}
        />
      </Example>
      <PropsTable
        rows={[
          {
            name: "items",
            type: '{ key: string; label: ReactNode; status: "pending" | "running" | "done" | "failed" }[]',
            description: {
              en: "One line per process, in the order they happen.",
              ja: "処理ごとに1行。起きる順に並べる。",
            },
          },
        ]}
      />
    </DocSection>
  )
}
