import { useRef, useState } from "react"

import { ArrowLeft, ArrowRight, Send } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { Sku } from "~/api/opm/schemas"
import { CabinetTabs } from "~/components/shelf/cabinet-tabs"
import { Button, Dialog, ToggleGroup } from "~/core"
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
  const { t } = useTranslation("app")
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
    <Dialog.Root
      className="flex h-[92dvh] max-w-dialog-xl flex-col gap-3 p-4 md:p-5"
      initialFocus={cancelRef}
      open
      onDismiss={busy ? undefined : onCancel}
    >
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div>
          <Dialog.Title className="text-xl">
            {t("workflow.layout.reviewTitle")}
          </Dialog.Title>
          <p className="mt-1 text-base text-secondary">
            {t("workflow.layout.reviewSubtitle")}
          </p>
        </div>
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
      {robotWillStop && (
        <p className="shrink-0 rounded-md bg-warning-subtle px-3 py-2 text-sm font-bold">
          {t("layoutSendStopsRobot")}
        </p>
      )}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-default pt-3">
        <p className="text-sm font-bold text-secondary">
          {t("workflow.layout.reviewLegend")}
        </p>
        <div className="flex gap-3">
          <Button
            ref={cancelRef}
            disabled={busy}
            icon={<ArrowLeft />}
            variant="secondary"
            onClick={onCancel}
          >
            {t("workflow.layout.backToEdit")}
          </Button>
          <Button busy={busy} icon={<Send />} onClick={onConfirm}>
            {t("workflow.layout.submit")}
          </Button>
        </div>
      </div>
    </Dialog.Root>
  )
}
