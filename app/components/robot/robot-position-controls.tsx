import { ArrowDown, ArrowUp, Bot } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "~/core"
import type { BusyAction } from "~/types/busy-action"

export type RobotPositionControlsProps = {
  enabled: boolean
  busyAction: BusyAction
  onMoveTop: () => void
  onMoveBottom: () => void
}

/** A work aid; availability comes from live robot status, never from a UI phase. */
export function RobotPositionControls({
  enabled,
  busyAction,
  onMoveTop,
  onMoveBottom,
}: RobotPositionControlsProps) {
  const { t } = useTranslation(["app", "common"])
  return (
    <aside className="grid min-w-0 grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto] sm:gap-y-1">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-sm font-bold sm:text-sm">
          <Bot className="size-5 shrink-0" />
          {t("workflow.position.title")}
        </p>
        <p className="mt-1 text-xs/relaxed text-secondary">
          {t("workflow.position.outside")}
        </p>
        {!enabled && (
          <p className="mt-1 text-xs text-secondary">
            {t("workflow.position.unavailable")}
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:w-48">
        <Button
          className="px-3 sm:px-4"
          variant="secondary"
          icon={<ArrowUp />}
          disabled={!enabled || Boolean(busyAction)}
          busy={busyAction === "rest-position-top"}
          onClick={onMoveTop}
        >
          {t("common:direction.up")}
        </Button>
        <Button
          className="px-3 sm:px-4"
          variant="secondary"
          icon={<ArrowDown />}
          disabled={!enabled || Boolean(busyAction)}
          busy={busyAction === "rest-position-bottom"}
          onClick={onMoveBottom}
        >
          {t("common:direction.down")}
        </Button>
      </div>
    </aside>
  )
}
