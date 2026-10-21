import { BookOpen, Ellipsis, Play } from "lucide-react"

import { ChoiceCard } from "~/core"

import { DocSection, Example, PropsTable, SubTitle, UseWhen } from "./doc-parts"

const ENTER_ICON = "/assets/home-study-2026-10-06/enter.svg"

export function ChoiceCardDoc() {
  return (
    <DocSection
      id="choice-card"
      title="ChoiceCard"
      lead={{
        en: "A large card staff tap to choose what to do or where to go next. Same outline, corners and pressed colour everywhere, so anything that looks like this is tappable.",
        ja: "次に何をするか・どこへ行くかを選ぶ、大きなカード。外枠・角・押した時の色をどこでも同じにして、この見た目なら押せると分かるようにします。",
      }}
      importLine={'import { ChoiceCard } from "~/core"'}
    >
      <UseWhen
        dos={[
          {
            en: "Entries on Home: ウォークインに入る, その他",
            ja: "ホームの入口：ウォークインに入る、その他",
          },
          {
            en: "A few equal choices in a popup (tile)",
            ja: "ポップアップの中の、並列な数個の選択肢（tile）",
          },
          {
            en: "Items in a list that open something: a manual page, a video",
            ja: "開くと中身が出る一覧の項目：マニュアルのページ、動画",
          },
        ]}
        donts={[
          {
            en: "Doing an action right away (send, start): that is a Button",
            ja: "その場で操作を実行する（送信、開始）→ Button",
          },
          {
            en: "Showing information nobody taps: use a plain box with bg-subtle",
            ja: "押さない情報の表示 → bg-subtle の囲み",
          },
          {
            en: "Restyling the outline or radius for one screen",
            ja: "1画面のために外枠や角を変える",
          },
        ]}
      />
      <SubTitle>{{ en: "Row", ja: "横長（row）" }}</SubTitle>
      <Example
        label={{ en: 'layout="row" (default)', ja: 'layout="row"（初期値）' }}
        note={{
          en: 'Icon, title, optional description. Add chevron when it opens more choices or another screen. size="sm" for longer lists.',
          ja: 'アイコン、見出し、必要なら説明。さらに選択肢や別の画面が開くなら chevron を付ける。長い一覧は size="sm"。',
        }}
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
      <SubTitle>
        {{ en: "Tile and media", ja: "タイル（tile）と画像付き（media）" }}
      </SubTitle>
      <Example
        label={'layout="tile" · layout="media"'}
        note={{
          en: "Tiles for 2–4 equal choices in a grid. Media when a picture identifies the item (a video).",
          ja: "tile は並列な2〜4個の選択肢をグリッドで。media は画像で中身が分かるもの（動画）に。",
        }}
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
      <SubTitle>{{ en: "States", ja: "状態" }}</SubTitle>
      <Example
        label="selected · disabled"
        note={{
          en: "Selected for a choice that stays chosen (language). Disabled when the robot or a task does not allow it; say why nearby.",
          ja: "selected は選んだ状態が続くもの（言語）。disabled はロボットや作業の都合で押せない時。理由を近くに書く。",
        }}
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
            description: {
              en: "Row: one line. Tile: icon over title in a grid. Media: picture on top.",
              ja: "row：1行。tile：アイコンの下に見出し（グリッド用）。media：上に画像。",
            },
          },
          {
            name: "size",
            type: '"md" | "sm"',
            defaultValue: '"md"',
            description: {
              en: "Rows only: 96px or 64px high.",
              ja: "row のみ：高さ 96px か 64px。",
            },
          },
          {
            name: "icon",
            type: "ReactNode",
            description: {
              en: "Icon or small picture, in a grey square.",
              ja: "アイコンか小さな絵。灰色の四角に入る。",
            },
          },
          {
            name: "title",
            type: "ReactNode",
            description: {
              en: "What it is, in a few words.",
              ja: "何なのかを短く。",
            },
          },
          {
            name: "description",
            type: "ReactNode",
            description: {
              en: "One line under the title.",
              ja: "見出しの下の1行。",
            },
          },
          {
            name: "media",
            type: "ReactNode",
            description: {
              en: "Media layout: the picture.",
              ja: "media の時の画像。",
            },
          },
          {
            name: "chevron",
            type: "boolean",
            defaultValue: "false",
            description: {
              en: "Rows only: it opens more choices or another screen.",
              ja: "row のみ：さらに選択肢や別の画面が開く。",
            },
          },
          {
            name: "selected",
            type: "boolean",
            defaultValue: "false",
            description: { en: "Stays chosen.", ja: "選んだ状態が続く。" },
          },
        ]}
      />
    </DocSection>
  )
}
