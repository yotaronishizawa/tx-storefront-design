import { useTranslation } from "react-i18next"

import type { DisplayManualJob, Sku } from "~/api/opm/schemas"
import { ProductThumb } from "~/components/product/product-thumb"
import {
  findCell,
  findRow,
  getColumnLabel,
  getRowLabel,
  type LayoutCabinet,
} from "~/model/shelf"
import { getLocalizedSkuName, getSkuVolume } from "~/model/sku"

export function ReservationList({
  board,
  jobs,
  skuById,
}: {
  board: LayoutCabinet[]
  /** `null` until the queue is first read. */
  jobs: DisplayManualJob[] | null
  skuById: Map<string, Sku>
}) {
  const { i18n, t } = useTranslation(["app", "common"])

  let body = (
    <p className="grid min-h-48 place-items-center text-center text-xs font-bold text-secondary">
      {jobs
        ? t("displayReservationListEmpty")
        : t("displayReservationListLoading")}
    </p>
  )
  if (jobs && jobs.length > 0) {
    body = (
      <ol className="grid gap-2">
        {jobs.map((job, index) => {
          const sku = skuById.get(job.skuId)
          const cell = findCell(board, job.locationId)
          const row = findRow(board, job.locationId)
          const lane =
            cell && row
              ? `${cell.cabinet}-${getRowLabel(row, "display")}-${getColumnLabel(cell, row, "display")}`
              : ""
          return (
            <li
              key={job.jobId}
              className="grid grid-cols-[28px_40px_minmax(0,1fr)] items-center gap-2 rounded-md border bg-default p-2"
            >
              <span className="grid size-7 place-items-center rounded-sm bg-muted text-xs font-bold">
                {index + 1}
              </span>
              <ProductThumb className="h-14 w-10" sku={sku} />
              <span className="min-w-0">
                <span className="line-clamp-2 text-xs/tight font-bold">
                  {getLocalizedSkuName(sku, i18n.language)}
                </span>
                <span className="mt-1 block truncate text-xs font-bold text-secondary">
                  {[getSkuVolume(sku), lane].filter(Boolean).join(" · ")}
                </span>
              </span>
            </li>
          )
        })}
      </ol>
    )
  }

  return (
    <section className="flex min-h-0 flex-col rounded-lg bg-subtle p-3">
      <h3 className="border-l-4 border-primary pl-2 text-sm font-bold">
        {t("displayReservationList")}
      </h3>
      {jobs && jobs.length > 0 && (
        <p className="mt-2 text-xs font-bold text-secondary">
          {t("displayReservationOrderHint")}
        </p>
      )}
      <div className="mt-2 min-h-0 flex-1 overflow-auto rounded-lg border bg-default p-2">
        {body}
      </div>
    </section>
  )
}
