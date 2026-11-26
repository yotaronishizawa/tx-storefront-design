import { useDocText, type DocText } from "./doc-lang"
import { DocSection } from "./doc-parts"

export type PrincipleNo = 1 | 2 | 3 | 4

type Principle = {
  no: PrincipleNo
  name: DocText
  short: DocText
  line: DocText
  why: DocText
  practice: DocText[]
  notMeant: DocText[]
}

/**
 * Store App's design principles. Draft (Yotaro 2026-11-26): not yet reviewed
 * by the team. The source is work-brain's context/store-app/design-principles.md.
 */
const PRINCIPLES: Principle[] = [
  {
    no: 1,
    name: { en: "Glance over read", ja: "読めば分かるより、一目で分かる" },
    short: { en: "Glance over read", ja: "一目で分かる" },
    line: {
      en: "Staff don't read the screen. Make it clear in the moment they turn to look.",
      ja: "店員は画面を読まない。振り返った一瞬で分かる形にする。",
    },
    why: {
      en: "Their hands are full and they look from a distance, briefly. A design that needs reading fails the moment it isn't read.",
      ja: "手がふさがっていて、画面は離れて一瞬見るだけ。読ませる設計は、読まれなかった瞬間に失敗する。",
    },
    practice: [
      {
        en: "Don't solve a UI problem with wording. Keep words short; the screen works even if they are skipped.",
        ja: "UI の課題を文言で解かない。文言は短く、読まれなくても成り立つ作りにする。",
      },
      {
        en: "Text 18px or larger. Screens read from a distance (idle, guidance) use a size readable from there.",
        ja: "文字は18px以上。離れて見る画面（待機・案内中）は、その距離で読める大きさにする。",
      },
      {
        en: "One strong point per screen. One meaning per colour or shape.",
        ja: "強く見せる所は1画面に1か所。色や形1つにつき意味は1つ。",
      },
      {
        en: "Photos and real items over words, so staff who can't read Japanese understand just as fast.",
        ja: "言葉より写真・実物の絵。日本語が読めない店員にも同じ速さで伝わる。",
      },
    ],
    notMeant: [
      {
        en: "Removing text. Sentences that state a condition, like a confirmation's body, stay.",
        ja: "文字をなくすこと。確認のポップアップの本文のように、条件を言う文は残す。",
      },
    ],
  },
  {
    no: 2,
    name: { en: "Step by step", ja: "一歩ずつ" },
    short: { en: "Step by step", ja: "一歩ずつ" },
    line: {
      en: "Don't make staff think. Show the one thing to do now.",
      ja: "店員に考えさせない。今やることを1つだけ出す。",
    },
    why: {
      en: "Leaving counts, order or which error to fix first to staff makes them hesitate, stop, and do it differently each time.",
      ja: "本数・順番・どのエラーから直すかを店員に委ねると、迷い、止まり、ばらつく。",
    },
    practice: [
      {
        en: "One list in priority order, not split into must / if you have time.",
        ja: "一覧は優先度順の1本にする。「最低限／余裕があれば」のように分けない。",
      },
      {
        en: "Don't make staff calculate counts.",
        ja: "本数は店員に計算させない。",
      },
      {
        en: "If the system can choose, it chooses and shows it.",
        ja: "選ばせずに済むなら、システムが選んで出す。",
      },
    ],
    notMeant: [
      {
        en: "Forcing an order where none is needed, or taking away stop, back and skip.",
        ja: "順番の要らない作業に順番を強いること。止める・戻る・飛ばすを奪うこと。",
      },
    ],
  },
  {
    no: 3,
    name: {
      en: "The shelf is the ground truth",
      ja: "整った画面より、実物どおり",
    },
    short: { en: "Shelf is the truth", ja: "実物どおり" },
    line: {
      en: "The screen mirrors the real shelf. Don't show as known what the system can't know.",
      ja: "画面は棚の実物を映す。システムに分からないことは、分かるように見せない。",
    },
    why: {
      en: "Staff compare the screen with the shelf. When they differ, comparing takes longer and mistakes grow; showing a guess as fact loses trust at once.",
      ja: "店員は画面と棚を見比べて動く。形がずれると手間とまちがいが増え、分からないことを分かるように見せると信頼を一度に失う。",
    },
    practice: [
      {
        en: "Draw shelves and drinks in their real proportions. Leave out what isn't on the shelf (volume, lane numbers).",
        ja: "棚・飲料は実物の比で描く。実物にない情報（容量、レーン番号）は描かない。",
      },
      {
        en: "Say where by what is on the shelf, not by body height.",
        ja: "位置は体の高さではなく、棚の中身の目印で言う。",
      },
    ],
    notMeant: [
      {
        en: "Drawing like a photo. Departing from the real thing to tell items apart is fine.",
        ja: "写真のように描くこと。見分けやすさのために実物から離すのはよい。",
      },
    ],
  },
  {
    no: 4,
    name: { en: "Stay out of the way", ja: "店員の邪魔をしない" },
    short: { en: "Stay out of the way", ja: "邪魔をしない" },
    line: {
      en: "Interfere with staff as little as possible. Asking is itself a cost, so only tell them what only they can fix.",
      ja: "店員の行動にはできるだけ干渉しない。知らせるのは店員でなければ直せないことだけ。",
    },
    why: {
      en: "Tell them everything and the alerts that matter get buried. A screen that changes on its own startles someone mid-task.",
      ja: "何でも知らせると、本当に動くべき知らせが埋もれる。作業中に画面が勝手に変わると、店員が驚く。",
    },
    practice: [
      {
        en: "What operators or OPM can fix is not shown to staff.",
        ja: "オペレーターや OPM で直せることは店員に出さない。",
      },
      {
        en: "Don't switch screens on your own. A popup gets attention; going to fix it is the person's own tap.",
        ja: "画面を勝手に切り替えない。気づかせるのはポップアップ、直す場所へ行くのは本人の1タップ。",
      },
      {
        en: "Undo and redo happen within the flow, without stopping the work.",
        ja: "取り消し・やり直しは、作業を中断させずに流れの中でできるようにする。",
      },
    ],
    notMeant: [
      {
        en: "Letting discrepancies pass. Errors only staff can fix are caught twice: when they happen and before sending.",
        ja: "discrepancy を残してよいこと。店員にしか直せないエラーは、起きた瞬間と送信の前の2回で拾う。",
      },
    ],
  },
]

/** A link from a rule to the principle behind it. */
export function PrincipleRef({ no }: { no: PrincipleNo }) {
  const tx = useDocText()
  const principle = PRINCIPLES.find((p) => p.no === no)
  if (!principle) return null
  return (
    <a
      href={`#principle-${no}`}
      className="ms-2 whitespace-nowrap text-secondary underline underline-offset-2"
    >
      {tx({ en: `Principle ${no}`, ja: `原則${no}` })}・{tx(principle.short)}
    </a>
  )
}

export function PrinciplesDoc() {
  const tx = useDocText()
  return (
    <DocSection
      id="principles"
      title={{ en: "Design principles (Draft)", ja: "デザイン原則（下書き）" }}
      lead={{
        en: "Draft: not yet reviewed by the team, and may change. Use them when two options both look right, or when picking pieces for a screen yourself. Rules elsewhere on this page link back here with “Principle N”. If one gets in your way, ask design.",
        ja: "下書きです。チームでまだ見直しておらず、変わることがあります。案が2つともよさそうな時や、自分で画面の部品を選ぶ時に使います。このページの他のルールから「原則N」でここにつながっています。原則が邪魔になったら、デザインに相談してください。",
      }}
    >
      <div className="flex flex-col gap-10">
        {PRINCIPLES.map((p) => (
          <article
            key={p.no}
            id={`principle-${p.no}`}
            className="flex max-w-4xl scroll-mt-6 flex-col gap-3"
          >
            <h3 className="text-xl font-bold">
              {p.no}. {tx(p.name)}
            </h3>
            <p className="text-lg font-bold">{tx(p.line)}</p>
            <p className="text-base text-secondary">{tx(p.why)}</p>
            <ul className="flex list-disc flex-col gap-1 ps-6 text-base">
              {p.practice.map((item) => (
                <li key={tx(item)}>{tx(item)}</li>
              ))}
            </ul>
            <p className="text-base text-secondary">
              {tx({ en: "This does not mean: ", ja: "こういう意味ではない：" })}
              {p.notMeant.map((item) => tx(item)).join(" ")}
            </p>
          </article>
        ))}
        <p className="max-w-4xl text-base">
          {tx({
            en: "When they conflict, Principle 1 wins by default: during restocking hands are full, so what has to be read goes unused however correct it is.",
            ja: "ぶつかった時は、原則1が既定で勝ちます。補充中は手がふさがっているので、読まないと分からない形は、どれだけ正しくても使われません。",
          })}
        </p>
      </div>
    </DocSection>
  )
}
