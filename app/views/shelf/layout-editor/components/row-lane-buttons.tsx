import { Plus, X } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "~/core"

const ROW_BUTTON_CLASS =
  "grid size-8 place-items-center rounded-md border border-strong bg-default text-primary transition active:bg-muted disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-4"

export function RowLaneButtons({
  canAdd,
  canRemove,
  onAdd,
  onRemove,
}: {
  canAdd: boolean
  canRemove: boolean
  onAdd: () => void
  onRemove: () => void
}) {
  const { t } = useTranslation("app")

  return (
    <div className="grid shrink-0 content-center gap-2">
      <Button
        variant="unstyled"
        size="unstyled"
        aria-label={t("layoutAddLane")}
        className={ROW_BUTTON_CLASS}
        disabled={!canAdd}
        type="button"
        onClick={onAdd}
      >
        <Plus />
      </Button>
      <Button
        variant="unstyled"
        size="unstyled"
        aria-label={t("layoutRemoveLane")}
        className={ROW_BUTTON_CLASS}
        disabled={!canRemove}
        type="button"
        onClick={onRemove}
      >
        <X />
      </Button>
    </div>
  )
}
