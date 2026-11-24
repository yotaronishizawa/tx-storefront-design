import { useState } from "react"

import { useTranslation } from "react-i18next"

import { Button, Dialog } from "~/core"
import { cn } from "~/utils/cn"

import { HomeObjectAction } from "./home-object-action"

/**
 * Study (`?homeEntry=a|b|c`, 2026-11-02): ways into the walk-in once
 * restocking and taking out are one task.
 * A: one "go into the walk-in" card, then ask what for.
 * B: "go into the walk-in" and "restock and take out" side by side.
 * C: one "go into the walk-in" card that always starts restocking.
 */
export type HomeEntryVariant = "a" | "b" | "c"

export function HomeEntryStudy({
  variant,
  inProgress,
  disabled,
  onEnterWalkIn,
  onRestock,
}: {
  variant: HomeEntryVariant
  /** The in-progress tag when a restock is open. */
  inProgress?: string
  disabled: boolean
  onEnterWalkIn: () => void
  onRestock: () => void
}) {
  const { t } = useTranslation("common")
  const [asking, setAsking] = useState(false)

  if (variant === "c") {
    return (
      <div className="grid min-h-64 shrink-0 grid-cols-1 lg:min-h-56 lg:flex-1">
        <WalkInCard
          disabled={disabled}
          inProgress={inProgress}
          onClick={onRestock}
        />
      </div>
    )
  }

  if (variant === "b") {
    return (
      <div className="grid min-h-64 shrink-0 grid-cols-2 gap-3 lg:min-h-56 lg:flex-1 lg:gap-4">
        <HomeObjectAction
          kind="restock"
          label="補充・品出し"
          inProgress={inProgress}
          disabled={disabled}
          onClick={onRestock}
        />
        <WalkInCard disabled={disabled} onClick={onEnterWalkIn} />
      </div>
    )
  }

  return (
    <>
      <div className="grid min-h-64 shrink-0 grid-cols-1 lg:min-h-56 lg:flex-1">
        <WalkInCard
          disabled={disabled}
          inProgress={inProgress}
          onClick={() => setAsking(true)}
        />
      </div>
      <Dialog.Popup
        open={asking}
        onClose={() => setAsking(false)}
        closeLabel={t("actions.close")}
        title="ウォークインで何をしますか？"
      >
        <div className="grid grid-cols-2 gap-3">
          <PurposeButton
            title="補充・品出し"
            note="在庫棚に飲料を入れる・出す"
            onClick={() => {
              setAsking(false)
              onRestock()
            }}
          />
          <PurposeButton
            title="入るだけ"
            note="掃除・箱を置く・確認など"
            onClick={() => {
              setAsking(false)
              onEnterWalkIn()
            }}
          />
        </div>
      </Dialog.Popup>
    </>
  )
}

/** The walk-in door drawing, at the size of the restock card beside it. */
function WalkInCard({
  inProgress,
  disabled,
  onClick,
}: {
  inProgress?: string
  disabled: boolean
  onClick: () => void
}) {
  return (
    <Button
      variant="unstyled"
      size="unstyled"
      aria-label="ウォークインに入る"
      disabled={disabled}
      onClick={onClick}
      className="relative size-full min-h-64 min-w-0 flex-col items-start justify-start overflow-hidden rounded-lg border-2 border-control bg-default text-left whitespace-normal text-primary lg:min-h-56"
    >
      <span className="flex w-full min-w-0 shrink-0 flex-col items-start px-4 pt-4 lg:px-5 lg:pt-5">
        <span className="text-[2rem]/tight font-bold">ウォークインに入る</span>
        {inProgress && (
          <span className="mt-2 inline-flex items-center gap-2.5 rounded-full bg-subtle px-5 py-2 text-xl font-bold text-primary">
            <span className="size-3.5 animate-pulse rounded-full bg-success" />
            {inProgress}
          </span>
        )}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none grid min-h-0 w-full flex-1 place-items-center p-6",
          inProgress ? "mt-2" : "mt-4"
        )}
      >
        <img
          src="/assets/home-study-2026-10-06/enter.svg"
          alt=""
          draggable={false}
          className="h-full max-h-40 w-auto"
        />
      </span>
    </Button>
  )
}

function PurposeButton({
  title,
  note,
  onClick,
}: {
  title: string
  note: string
  onClick: () => void
}) {
  return (
    <Button
      variant="unstyled"
      size="unstyled"
      onClick={onClick}
      className="min-h-40 flex-col items-start justify-between gap-4 rounded-lg border-2 border-control bg-default p-5 text-left whitespace-normal text-primary active:bg-subtle"
    >
      {/* Inline sizes: the popup's body text size wins over class sizes here. */}
      <span className="font-bold" style={{ fontSize: 28, lineHeight: 1.2 }}>
        {title}
      </span>
      <span
        className="text-secondary"
        style={{ fontSize: 20, lineHeight: 1.3 }}
      >
        {note}
      </span>
    </Button>
  )
}
