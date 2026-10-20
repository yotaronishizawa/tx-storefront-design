import { useState } from "react"

import { ChevronRight, Ellipsis } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button, Dialog } from "~/core"

type MoreAction = {
  key: string
  icon: "layout" | "reservation" | "stock-count"
  title: string
  disabled: boolean
  onClick: () => void
}

/**
 * Layout change, display reservations and required stock: each used a few
 * times a week, by different people at different times, against different
 * shelves. So no shared name; one entry under the daily three, its contents
 * spelled out under the label, opening the three as large choices.
 */
export function HomeMoreActions({
  disabled,
  actions,
}: {
  disabled: boolean
  actions: MoreAction[]
}) {
  const { t } = useTranslation(["app", "common"])
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="unstyled"
        size="unstyled"
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="mx-3 flex min-h-24 shrink-0 items-center justify-start gap-3 rounded-lg border border-black/30 px-4 py-3 text-left whitespace-normal active:bg-subtle"
      >
        <span className="flex size-10 shrink-0 items-center justify-center text-secondary">
          <Ellipsis aria-hidden="true" className="size-7" />
        </span>
        <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="text-xl/tight font-bold text-primary">
            {t("workflow.home.moreActions")}
          </span>
          <span className="text-base/tight text-secondary">
            {actions.map((action) => action.title).join("・")}
          </span>
        </span>
        <ChevronRight
          aria-hidden="true"
          className="size-6 shrink-0 text-secondary"
        />
      </Button>

      <Dialog.Root
        className="grid w-240 max-w-[calc(100vw-2rem)] gap-6 p-6"
        open={open}
        onDismiss={() => setOpen(false)}
      >
        <div className="flex items-center justify-between gap-4">
          <Dialog.Title className="text-display/tight">
            {t("workflow.home.moreActions")}
          </Dialog.Title>
          <Dialog.Close aria-label={t("common:actions.close")} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {actions.map((action) => (
            <Button
              key={action.key}
              variant="unstyled"
              size="unstyled"
              type="button"
              disabled={action.disabled}
              onClick={() => {
                setOpen(false)
                action.onClick()
              }}
              className="flex min-h-40 w-full flex-col items-start justify-between gap-4 rounded-lg border-2 border-black/20 bg-default p-5 text-left whitespace-normal active:bg-subtle"
            >
              <span className="grid size-16 place-items-center rounded-lg bg-subtle">
                <img
                  src={`/assets/home-study-2026-10-06/${action.icon}.${action.icon === "stock-count" ? "png" : "svg"}`}
                  alt=""
                  draggable={false}
                  className={
                    action.icon === "stock-count" ? "size-full" : "h-9 w-auto"
                  }
                />
              </span>
              <span className="text-xl/tight font-bold">{action.title}</span>
            </Button>
          ))}
        </div>
      </Dialog.Root>
    </>
  )
}
