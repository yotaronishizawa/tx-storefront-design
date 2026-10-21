import { useState } from "react"

import { Ellipsis } from "lucide-react"
import { useTranslation } from "react-i18next"

import { ChoiceCard, Dialog } from "~/core"

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
      <ChoiceCard
        className="mx-3 w-auto shrink-0"
        disabled={disabled}
        onClick={() => setOpen(true)}
        icon={<Ellipsis />}
        title={t("workflow.home.moreActions")}
        description={actions.map((action) => action.title).join("・")}
        chevron
      />

      <Dialog.Popup
        open={open}
        onClose={() => setOpen(false)}
        closeLabel={t("common:actions.close")}
        size="wide"
        title={t("workflow.home.moreActions")}
      >
        <div className="grid grid-cols-3 gap-4">
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
                <img
                  src={`/assets/home-study-2026-10-06/${action.icon}.${action.icon === "stock-count" ? "png" : "svg"}`}
                  alt=""
                  draggable={false}
                  className={
                    action.icon === "stock-count" ? "size-full" : "h-9 w-auto"
                  }
                />
              }
              title={action.title}
            />
          ))}
        </div>
      </Dialog.Popup>
    </>
  )
}
