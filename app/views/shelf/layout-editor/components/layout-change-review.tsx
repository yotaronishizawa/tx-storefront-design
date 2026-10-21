import { useRef, useState } from "react"

import { ArrowLeft, ArrowRight, Send } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { Sku } from "~/api/opm/schemas"
import { CabinetTabs } from "~/components/shelf/cabinet-tabs"
import { Button, Dialog, Notice, ToggleGroup } from "~/core"
import type { LayoutCabinet } from "~/model/shelf"
import { cn } from "~/utils/cn"

import { getLayoutDiff } from "../utils/layout-diff"
import { ChangeLayoutCellButton } from "./change-layout-cell-button"
import { LayoutShelfCanvas } from "./layout-shelf-canvas"

export function LayoutChangeReview({
  before,
  after,
  cabinetNumber,
  skuById,
  busy,
  robotWillStop,
  onCancel,
  onConfirm,
}: {
  before: LayoutCabinet[]
  after: LayoutCabinet[]
  cabinetNumber?: number
  skuById: Map<string, Sku>
  busy: boolean
  robotWillStop: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  const { t } = useTranslation(["app", "common"])
  const cancelRef = useRef<HTMLButtonElement>(null)
  const [version, setVersion] = useState("after")
  const [cabinet, setCabinet] = useState(cabinetNumber ?? after[0]?.cabinet)
  const diff = getLayoutDiff(before, after)
  const board = version === "before" ? before : after
  const current = board.find((item) => item.cabinet === cabinet)
  const tabs = [
    ...new Map(
      [...before, ...after].map((item) => [item.cabinet, item])
    ).values(),
  ]
  return (
    <Dialog.Popup
      open
      onClose={busy ? undefined : onCancel}
      closeLabel={t("common:actions.close")}
      title={t("workflow.layout.reviewTitle")}
      size="panel"
      initialFocus={cancelRef}
      actions={
        <Dialog.Actions>
          <Button busy={busy} icon={<Send />} size="lg" onClick={onConfirm}>
            {t("workflow.layout.submit")}
          </Button>
          <Button
            ref={cancelRef}
            disabled={busy}
            icon={<ArrowLeft />}
            size="lg"
            variant="secondary"
            onClick={onCancel}
          >
            {t("workflow.layout.backToEdit")}
          </Button>
        </Dialog.Actions>
      }
    >
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <p className="text-secondary">{t("workflow.layout.reviewSubtitle")}</p>
        <span className="rounded-full bg-warning-subtle px-4 py-2 text-base font-bold text-primary">
          {t("workflow.layout.unsentCount", { count: diff.changes.size })}
        </span>
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <CabinetTabs
          board={tabs}
          kind="display"
          value={cabinet}
          onChange={setCabinet}
        />
        <ToggleGroup
          className="flex rounded-lg bg-subtle p-1"
          itemClassName={(selected) =>
            cn(
              "flex h-12 items-center gap-2 rounded-md px-5 text-base font-bold",
              selected ? "bg-inverse text-inverse" : "text-secondary"
            )
          }
          options={[
            { value: "before", label: t("workflow.layout.registered") },
            {
              value: "after",
              label: (
                <>
                  {t("workflow.layout.proposal")}
                  <ArrowRight className="size-4" />
                </>
              ),
            },
          ]}
          value={version}
          onValueChange={setVersion}
        />
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {diff.rows.map((row) => (
          <span
            key={`${row.cabinet}:${row.row}`}
            className="rounded-md bg-subtle px-3 py-2 text-sm font-bold text-secondary"
          >
            {t("workflow.layout.changedRow", {
              cabinet: row.cabinet,
              row: row.row + 1,
              count: row.count,
            })}
          </span>
        ))}
        {diff.removed > 0 && (
          <Button
            className="text-error"
            size="sm"
            variant="secondary"
            onClick={() => setVersion("before")}
          >
            {t("workflow.layout.reviewRemoved", { count: diff.removed })}
          </Button>
        )}
      </div>
      <LayoutShelfCanvas
        cabinet={current}
        renderCell={(cell) => (
          <ChangeLayoutCellButton
            cell={cell}
            changed={diff.changes.has(cell.id)}
            removed={diff.changes.get(cell.id) === "removed"}
            skuById={skuById}
          />
        )}
      />
      <p className="shrink-0 text-base text-secondary">
        {t("workflow.layout.reviewLegend")}
      </p>
      {robotWillStop && (
        <Notice className="shrink-0" tone="warning">
          {t("layoutSendStopsRobot")}
        </Notice>
      )}
    </Dialog.Popup>
  )
}
