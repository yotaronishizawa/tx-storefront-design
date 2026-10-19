/**
 * Keyword search over the CX manual decks, page by page. The index is built
 * from the decks' PDFs (public/manual-search, local only: the decks are marked
 * Confidential) and read once, the first time someone searches.
 */

export type ManualDoc = {
  key: string
  title: string
  /** The deck in Google Slides, for the full version. */
  url: string
  /** Each page's text, already NFKC-normalised. */
  pages: string[]
  /** Each page's image file under `/manual-search/pages/`. */
  images: string[]
  /** Each page's title line, as the slide shows it. */
  headings: string[]
}

export type ManualHit = {
  doc: ManualDoc
  /** 0-based. */
  page: number
  score: number
  /** The text around the first match, and where the matches sit in it. */
  snippet: { text: string; marks: [number, number][] }
}

const INDEX_URL = "/manual-search/index.json"
export const MANUAL_PAGE_IMAGE_BASE = "/manual-search/pages/"

let indexPromise: Promise<ManualDoc[]> | null = null

/** A section of a deck, by its slide title, so CX can re-order pages. */
type ManualPick = { deck: string; heading: string }

const HOME_PICKS: ManualPick[] = [
  { deck: "trouble-flow", heading: "ロボットが動かない" },
  { deck: "robot-status", heading: "状況別:対応方法早見表" },
  { deck: "robot-status", heading: "よくある質問" },
  { deck: "trouble-flow", heading: "アプリが開かない" },
  { deck: "tablet", heading: "状況別対応一覧" },
]

/**
 * What staff on each screen most likely came to ask, picked from the
 * manual's own troubleshooting and FAQ pages. A first guess: search logs
 * should decide these later.
 */
const PICKS_BY_PATHNAME: Record<string, ManualPick[]> = {
  "/": HOME_PICKS,
  "/restocking": [
    { deck: "trouble-flow", heading: "補充が開始できない" },
    { deck: "trouble-flow", heading: "補充が終了できない" },
    { deck: "trouble-flow", heading: "スキャンができない" },
    { deck: "shelf-guide", heading: "補充時の注意事項" },
    { deck: "scanner", heading: "よくある質問" },
  ],
  "/manual": [
    {
      deck: "shelf-guide",
      heading: "スマートシェルフから売場棚に手で品出しする",
    },
    { deck: "shelf-guide", heading: "スマートシェルフから削除する" },
    { deck: "robot-operation", heading: "手補充モード" },
    { deck: "restock", heading: "よくある質問" },
  ],
  "/edit": [
    { deck: "planogram-change", heading: "状況別対応方法" },
    { deck: "planogram-change", heading: "よくある質問" },
    { deck: "planogram-change", heading: "棚割変更の基本ルール" },
    { deck: "robot-guide", heading: "陳列対象外に設定する" },
  ],
  "/walk-in": [
    { deck: "robot-guide", heading: "ウォークインに入る(ロボットを止める)" },
    { deck: "robot-guide", heading: "ウォークインから出る(ロボットを動かす)" },
    { deck: "walk-in-work", heading: "作業前の確認事項" },
    { deck: "robot-operation", heading: "ロボットを上・下に移動する" },
  ],
  "/display": [
    { deck: "robot-operation", heading: "陳列予約機能" },
    { deck: "robot-operation", heading: "よくある質問" },
  ],
  "/recommendations": [
    { deck: "shelf-manual", heading: "必要在庫本数を設定・変更する" },
    { deck: "shelf-manual", heading: "推奨補充本数を設定・変更する" },
  ],
}

export type ManualPage = { doc: ManualDoc; page: number }

/** The pages to offer before anything is typed, for the screen behind the help. */
export function manualPicksFor(
  docs: ManualDoc[],
  pathname: string
): ManualPage[] {
  const picks = PICKS_BY_PATHNAME[pathname] ?? HOME_PICKS
  return picks.flatMap(({ deck, heading }) => {
    const doc = docs.find((candidate) => candidate.key === deck)
    const page = doc?.headings.indexOf(heading) ?? -1
    return doc && page >= 0 ? [{ doc, page }] : []
  })
}

export function loadManualIndex(): Promise<ManualDoc[]> {
  indexPromise ??= fetch(INDEX_URL)
    .then((response) => (response.ok ? response.json() : { docs: [] }))
    .then((data: { docs?: ManualDoc[] }) => data.docs ?? [])
    .catch(() => {
      indexPromise = null
      return []
    })
  return indexPromise
}

/**
 * Everyday words staff type, and the words the manual uses for them. CX can
 * grow this as searches come in.
 */
const SAME_AS: [string, string][] = [
  ["止め", "停止"],
  ["止ま", "停止"],
  ["とめ", "停止"],
  ["終わ", "終了"],
  ["おわ", "終了"],
  ["始め", "開始"],
  ["はじめ", "開始"],
  ["直す", "修正"],
  ["直し", "修正"],
  ["つなが", "接続"],
  ["繋が", "接続"],
  ["ネット", "wifi"],
  ["電話", "お問い合わせ"],
  ["連絡先", "お問い合わせ"],
]

const IGNORED = new Set(["-", "・", "/", " ", "　", "(", ")", "「", "」"])

/**
 * Folds text so 「スキャナー」 finds 「すきゃなー」 and 「wifi」 finds
 * 「Wi-Fi」: lower case, katakana to hiragana, and no hyphens, dots or
 * spaces. `at[i]` is where the folded character `i` sits in the original, so
 * matches can be marked there.
 */
function fold(text: string): { folded: string; at: number[] } {
  let folded = ""
  const at: number[] = []
  Array.from(text).forEach((char, index) => {
    if (IGNORED.has(char)) return
    const lower = char.toLowerCase()
    const code = lower.charCodeAt(0)
    // Katakana ァ..ヶ to hiragana.
    folded +=
      code >= 0x30a1 && code <= 0x30f6
        ? String.fromCharCode(code - 0x60)
        : lower
    at.push(index)
  })
  return { folded, at }
}

function terms(query: string): string[][] {
  return query
    .normalize("NFKC")
    .split(/\s+/)
    .map((term) => fold(term).folded)
    .filter((term) => term.length > 0)
    .map((term) => {
      const variants = new Set([term])
      for (const [said, written] of SAME_AS) {
        const from = fold(said).folded
        if (term.includes(from))
          variants.add(term.replace(from, fold(written).folded))
      }
      return [...variants]
    })
}

function countOf(haystack: string, needle: string): number {
  let count = 0
  let at = haystack.indexOf(needle)
  while (at !== -1) {
    count++
    at = haystack.indexOf(needle, at + needle.length)
  }
  return count
}

const SNIPPET_BEFORE = 24
const SNIPPET_LENGTH = 90
/** Share of the query's two-character pieces a page must hold. */
const MIN_COVERAGE = 0.7

/**
 * People type 「スキャンできない」 where the manual says 「スキャンができない」,
 * so a page matches on most of the query's two-character pieces, not only on
 * the exact words. Exact words still rank first.
 */
function piecesOf(word: string): string[] {
  if (word.length < 2) return [word]
  const pieces = new Set<string>()
  for (let at = 0; at < word.length - 1; at++)
    pieces.add(word.slice(at, at + 2))
  return [...pieces]
}

/** The longest stretch of the word that appears whole on the page. */
function longestRun(folded: string, word: string): number {
  for (let length = word.length; length >= 2; length--) {
    for (let at = 0; at + length <= word.length; at++) {
      if (folded.includes(word.slice(at, at + length))) return length
    }
  }
  return 0
}

function snippetFor(
  text: string,
  folded: string,
  at: number[],
  pieces: string[]
) {
  let first = -1
  for (const piece of pieces) {
    const found = folded.indexOf(piece)
    if (found !== -1 && (first === -1 || found < first)) first = found
  }
  const covered = new Array<boolean>(text.length).fill(false)
  for (const piece of pieces) {
    let found = folded.indexOf(piece)
    while (found !== -1) {
      for (let k = found; k < found + piece.length; k++) covered[at[k]] = true
      found = folded.indexOf(piece, found + 1)
    }
  }
  const origin = first === -1 ? 0 : at[first]
  const start = Math.max(0, origin - SNIPPET_BEFORE)
  const end = Math.min(text.length, start + SNIPPET_LENGTH)
  const prefix = start > 0 ? "…" : ""
  const suffix = end < text.length ? "…" : ""
  const marks: [number, number][] = []
  for (let k = start; k < end; k++) {
    if (!covered[k]) continue
    const from = k - start + prefix.length
    const last = marks.at(-1)
    if (last && last[1] === from) last[1] = from + 1
    else marks.push([from, from + 1])
  }
  return { text: prefix + text.slice(start, end) + suffix, marks }
}

/**
 * A page matches when, for every word (or the manual's word for it), it holds
 * the word or most of its two-character pieces. Exact words, then the longest
 * stretch held whole, then pieces held, then decks named for the word, rank it.
 */
export function searchManual(docs: ManualDoc[], query: string): ManualHit[] {
  const words = terms(query)
  if (words.length === 0) return []
  const hits: ManualHit[] = []
  for (const doc of docs) {
    const title = fold(doc.title).folded
    doc.pages.forEach((text, page) => {
      const { folded, at } = fold(text)
      let score = 0
      const matched: string[] = []
      for (const variants of words) {
        let best = -1
        let bestPieces: string[] = []
        for (const word of variants) {
          const pieces = piecesOf(word)
          const held = pieces.filter((piece) => folded.includes(piece)).length
          const coverage = held / pieces.length
          const exact = countOf(folded, word)
          if (exact === 0 && coverage < MIN_COVERAGE) continue
          const run = longestRun(folded, word) / word.length
          const value =
            Math.min(exact, 5) * 10 +
            run * 8 +
            coverage * 4 +
            (title.includes(word) ? 3 : 0)
          if (value > best) {
            best = value
            // Mark the whole word where it appears; pieces only when it does not.
            bestPieces = exact > 0 ? [word] : pieces
          }
        }
        if (best < 0) return
        score += best
        matched.push(...bestPieces)
      }
      hits.push({
        doc,
        page,
        score,
        snippet: snippetFor(text, folded, at, [...new Set(matched)]),
      })
    })
  }
  return hits.sort((a, b) => b.score - a.score)
}
