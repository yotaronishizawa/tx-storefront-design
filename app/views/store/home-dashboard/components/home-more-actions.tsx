import { useState, type ReactElement } from "react"

import { Ellipsis } from "lucide-react"
import { useTranslation } from "react-i18next"

import { ChoiceCard, Dialog } from "~/core"

type MoreAction = {
  key: string
  /** An asset name, or an icon element for entries without an asset. */
  icon: "layout" | "reservation" | "stock-count" | ReactElement
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
  className,
  disabled,
  actions,
}: {
  className?: string
  disabled: boolean
  actions: MoreAction[]
}) {
  const { t } = useTranslation(["app", "common"])
  const [open, setOpen] = useState(false)

  return (
    <>
      <ChoiceCard
        className={className ?? "mx-3 w-auto shrink-0"}
        disabled={disabled}
        onClick={() => setOpen(true)}
        icon={<Ellipsis />}
        title={t("workflow.home.moreActions")}
        description={
          // One line, so the card keeps the height of the cards beside and
          // above it on a narrow screen; the dialog spells each one out.
          <span className="line-clamp-1">
            {actions.map((action) => action.title).join("・")}
          </span>
        }
        chevron
      />

      <Dialog.Popup
        open={open}
        onClose={() => setOpen(false)}
        closeLabel={t("common:actions.close")}
        size="wide"
        title={t("workflow.home.moreActions")}
      >
        <div
          className={`grid gap-4 ${actions.length % 2 === 0 ? "grid-cols-2" : "grid-cols-3"}`}
        >
          {actions.map((action) => (
            <ChoiceCard
              key={action.key}
              layout="tile"
              disabled={action.disabled}
              onClick={() => {
                setOpen(false)
                action.onClick()
              }}
              icon={
                typeof action.icon !== "string" ? (
                  action.icon
                ) : (
                  <img
                    src={`/assets/home-study-2026-10-06/${action.icon}.${action.icon === "stock-count" ? "png" : "svg"}`}
                    alt=""
                    draggable={false}
                    className={
                      action.icon === "stock-count" ? "size-full" : "h-9 w-auto"
                    }
                  />
                )
              }
              title={action.title}
            />
          ))}
        </div>
      </Dialog.Popup>
    </>
  )
}
