import { useState, type ReactNode } from "react"

import { ChevronLeft, ChevronRight, Send, StickyNote } from "lucide-react"

import { Button, Checkbox } from "~/core"
import { cn } from "~/utils/cn"

// Wireframe: the owner-facing "work report" — the robot shown as one member of
// staff with a timesheet. Japanese copy and sample numbers are hard-coded until
// the direction is agreed; nothing here reads OPM yet.

type Tab = "screen" | "card"
type HourState = "work" | "storeStop" | "down"

const DAYS = 31

/** Sample month: works around the clock, stopped by the store for the
 * afternoon delivery, a couple of TX-side outages. Deterministic. */
function sampleHour(day: number, hour: number): HourState {
  if (day === 12 && hour >= 9 && hour <= 11) return "down"
  if (day === 25 && hour === 3) return "down"
  if (hour === 14 || (hour === 15 && day % 3 === 0)) return "storeStop"
  if (hour === 6 && day % 2 === 0) return "storeStop"
  return "work"
}

const SAMPLE = {
  month: "10月",
  range: "10月1日〜31日",
  storeName: "〇〇店",
  workHours: 620,
  nightHours: 210,
  manualDays: 0,
}

export function WorkReportView() {
  const [tab, setTab] = useState<Tab>("screen")
  const [showNotes, setShowNotes] = useState(true)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">ロボットのレポート</h1>
          <div className="flex items-center gap-1 rounded-full bg-default p-1">
            <IconButton label="前の月">
              <ChevronLeft className="size-5" />
            </IconButton>
            <span className="px-2 text-lg font-bold">{SAMPLE.month}</span>
            <IconButton label="次の月" disabled>
              <ChevronRight className="size-5" />
            </IconButton>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Segmented
            value={tab}
            options={[
              { value: "screen", label: "Store App の画面" },
              { value: "card", label: "月末に届く1枚" },
            ]}
            onChange={setTab}
          />
          <Button
            variant="unstyled"
            size="unstyled"
            type="button"
            onClick={() => setShowNotes((v) => !v)}
            className={cn(
              "flex min-h-11 items-center gap-2 rounded-full border border-dashed border-strong px-3 text-sm font-bold",
              showNotes && "bg-default"
            )}
          >
            <StickyNote className="size-4" />
            メモ {showNotes ? "ON" : "OFF"}
          </Button>
        </div>
      </div>

      {tab === "screen" ? (
        <ScreenWire showNotes={showNotes} onOpenCard={() => setTab("card")} />
      ) : (
        <CardWire showNotes={showNotes} />
      )}
    </div>
  )
}

function ScreenWire({
  showNotes,
  onOpenCard,
}: {
  showNotes: boolean
  onOpenCard: () => void
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="flex flex-col gap-4 lg:col-span-2">
        {/* 1. The one line an owner can repeat to another owner. */}
        <Box>
          <p className="text-sm text-secondary">{SAMPLE.range}</p>
          <p className="mt-2 text-lg font-bold">今月のロボットの勤務</p>
          <p className="mt-1 font-bold">
            <span className="text-display-lg">{SAMPLE.workHours}</span>
            <span className="ml-2 text-xl">時間</span>
          </p>
          <Note show={showNotes}>
            主役は勤務時間の数字そのもの。一文で言い切らず、評価（安い・すごい）はオーナーに任せる。時給（5万円÷時間）は書かない
          </Note>
        </Box>

        {/* 2. Hours, the way an owner reads a shift sheet. */}
        <div className="grid grid-cols-2 gap-4">
          <Stat
            label="うち深夜（22〜5時）"
            value={SAMPLE.nightHours}
            unit="時間"
          />
          <Stat label="手で補充した日" value={SAMPLE.manualDays} unit="日" />
        </div>
        <Note show={showNotes}>
          「勤務」の定義が未決。売場の補充・スキャンをしていた時間か、売場を担当していた（止められていない）時間か。待機やオフラインを入れると水増しになる
        </Note>

      </div>

      <div className="flex flex-col gap-4">
        <Box>
          <h2 className="text-lg font-bold">任せたこと</h2>
          <ul className="mt-3 grid gap-3">
            <ListLine>売場の補充（毎日）</ListLine>
            <ListLine>深夜帯の補充はすべてロボット</ListLine>
          </ul>
          <Note show={showNotes}>
            オーナーの言葉で書く（本数ではなく任せたこと）。どの文を出すかは店の実績で切り替え
          </Note>
        </Box>

        {/* 「今月よく出た飲料」は方向が違うので一旦外した（2026-10-16） */}
        <Button
          variant="unstyled"
          size="unstyled"
          type="button"
          onClick={onOpenCard}
          className="flex min-h-14 items-center justify-center gap-2 rounded-xl bg-inverse text-lg font-bold text-inverse"
        >
          <Send className="size-5" />
          月末の1枚を見る・送る
        </Button>
      </div>
    </div>
  )
}

function CardWire({ showNotes }: { showNotes: boolean }) {
  const [hideStore, setHideStore] = useState(false)
  return (
    <div className="flex flex-wrap items-start justify-center gap-8">
      {/* Phone-sized: it travels by screenshot between owners. */}
      <div className="flex w-[340px] flex-col gap-5 rounded-xl border-2 border-strong bg-default p-6">
        <div className="flex items-center justify-between">
          <Placeholder className="h-6 w-16" label="ロゴ" />
          <span className="text-sm text-secondary">
            {hideStore ? "" : SAMPLE.storeName}
          </span>
        </div>
        <div>
          <p className="text-sm text-secondary">{SAMPLE.month}の勤務</p>
          <p className="mt-1 font-bold">
            <span className="text-display-lg">{SAMPLE.workHours}</span>
            <span className="ml-2 text-xl">時間</span>
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="うち深夜" value={SAMPLE.nightHours} unit="時間" compact />
          <Stat label="手で補充した日" value={SAMPLE.manualDays} unit="日" compact />
        </div>
        <MiniMonth />
        <p className="text-sm">深夜帯の補充は、すべてロボットが担当しました。</p>
        <Placeholder className="h-10 w-full" label="TX の連絡先・QR" />
      </div>

      <div className="flex w-[360px] flex-col gap-4">
        <Box>
          <h2 className="text-lg font-bold">月末に届く1枚</h2>
          <p className="mt-2 text-sm text-secondary">
            オーナーのスマホに届き、そのままスクショで他のオーナーへ回る前提
          </p>
          <label className="mt-4 flex min-h-11 items-center gap-3 font-bold">
            <Checkbox.Root
              className="size-5"
              checked={hideStore}
              onCheckedChange={(checked) => setHideStore(checked)}
            />
            店名を隠す
          </label>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Placeholder className="h-11" label="画像を保存" />
            <Placeholder className="h-11" label="送る" />
          </div>
        </Box>
        <Note show={showNotes}>
          届け方は未定（メール／LINE／Biz が手渡し）。悪い月（TX の不具合で止まった月など）は届けない・見せ方を変えるルールが要る
        </Note>
        <Note show={showNotes}>
          時給は書かない。オーナーが自分で 5万円÷時間 を計算する。強い一文「時給80円のスタッフ」は Biz の商談資料用に分ける
        </Note>
      </div>
    </div>
  )
}

function MiniMonth() {
  return (
    <div className="grid grid-cols-7 gap-1">
      {Array.from({ length: DAYS }, (_, i) => i + 1).map((day) => {
        const hadDown = Array.from({ length: 24 }, (_, h) => h).some(
          (h) => sampleHour(day, h) === "down"
        )
        return (
          <span
            key={day}
            className={cn(
              "grid aspect-square place-items-center rounded-md text-[10px] font-bold",
              hadDown
                ? "border border-dashed border-strong"
                : "bg-inverse text-inverse"
            )}
          >
            {day}
          </span>
        )
      })}
    </div>
  )
}

function Box({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-xl border border-default bg-default p-5">
      {children}
    </section>
  )
}

function Stat({
  label,
  value,
  unit,
  compact,
}: {
  label: string
  value: number
  unit: string
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-default bg-default",
        compact ? "p-3" : "p-5"
      )}
    >
      <p className="text-sm text-secondary">{label}</p>
      <p className="mt-1 font-bold">
        <span className={compact ? "text-xl" : "text-display"}>{value}</span>
        <span className="ml-1 text-base">{unit}</span>
      </p>
    </div>
  )
}

function ListLine({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-center gap-3">
      <span className="size-3 shrink-0 rounded-full bg-inverse" />
      <span className="font-bold">{children}</span>
    </li>
  )
}

function Placeholder({
  className,
  label,
}: {
  className?: string
  label?: string
}) {
  return (
    <span
      className={cn(
        "grid place-items-center rounded-md bg-muted text-xs text-secondary",
        className
      )}
    >
      {label}
    </span>
  )
}

function Note({ show, children }: { show: boolean; children: ReactNode }) {
  if (!show) return null
  return (
    <p className="mt-3 rounded-lg border border-dashed border-strong px-3 py-2 text-xs/relaxed text-secondary">
      メモ: {children}
    </p>
  )
}

function IconButton({
  label,
  disabled,
  children,
}: {
  label: string
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <Button
      variant="unstyled"
      size="unstyled"
      type="button"
      aria-label={label}
      disabled={disabled}
      className="grid size-11 place-items-center rounded-full disabled:opacity-30"
    >
      {children}
    </Button>
  )
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div className="flex rounded-full bg-default p-1">
      {options.map((option) => (
        <Button
          key={option.value}
          variant="unstyled"
          size="unstyled"
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "min-h-10 rounded-full px-4 text-sm font-bold",
            value === option.value && "bg-inverse text-inverse"
          )}
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}
