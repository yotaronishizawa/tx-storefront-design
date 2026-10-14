import { useEffect, useMemo, useRef, useState } from "react"

import { ChevronDown, ChevronUp } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "~/core"
import type { RecommendationRow } from "~/model/shelf"
import { cn } from "~/utils/cn"

import type {
  RecommendationSort,
  RecommendationSortKey,
} from "../utils/restocking-view-types"
import {
  sortRecommendationRows,
  toggleRecommendationSort,
} from "../utils/restocking-view-utils"
import { RecommendationTableBody } from "./recommendation-table-body"
import { RECOMMENDATION_GRID } from "./restocking-recommendation-row"

/** How long the last row stays lit after a scan with no row. */
const RETURN_TO_TOP_DELAY_MS = 2000

const DEFAULT_SORT: RecommendationSort = {
  direction: "descending",
  key: "neededCount",
}

const COLUMNS = [
  { key: "recommendationCount", labelKey: "recommendedCountLabel" },
  { key: "currentCount", labelKey: "smartShelfStockLabel" },
  { key: "neededCount", labelKey: "neededShortLabel" },
] as const satisfies readonly {
  key: RecommendationSortKey
  labelKey: string
}[]

export function RecommendationTable({
  highlightedSkuId = "",
  label,
  loading,
  readFailed,
  reloading,
  rows,
  onReload,
}: {
  /** The scanned drink, whose row is highlighted. */
  highlightedSkuId?: string
  label: string
  loading: boolean
  /** Shown as an error, since an empty table would read as "nothing needed". */
  readFailed: boolean
  reloading: boolean
  rows: RecommendationRow[]
  onReload: () => void
}) {
  const { t } = useTranslation(["app", "common"])
  const [sort, setSort] = useState(DEFAULT_SORT)
  const sortedRows = useMemo(
    () => sortRecommendationRows(rows, sort),
    [rows, sort]
  )
  const SortIcon = sort.direction === "ascending" ? ChevronUp : ChevronDown
  const listRef = useRef<HTMLDivElement>(null)
  const highlightListed = rows.some((row) => row.skuId === highlightedSkuId)
  const [focusedSkuId, setFocusedSkuId] = useState(
    highlightListed ? highlightedSkuId : ""
  )
  if (highlightListed && focusedSkuId !== highlightedSkuId) {
    setFocusedSkuId(highlightedSkuId)
  }

  // A scan with no row keeps the last row lit briefly, then clears it and
  // scrolls back to the top.
  useEffect(() => {
    if (highlightListed || !focusedSkuId) {
      return
    }
    const timer = window.setTimeout(() => {
      setFocusedSkuId("")
      listRef.current?.scrollTo({ behavior: "smooth", top: 0 })
    }, RETURN_TO_TOP_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [focusedSkuId, highlightListed, highlightedSkuId])

  return (
    <section
      aria-label={label}
      className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-lg border bg-default"
      role="table"
    >
      <div
        className={cn(
          RECOMMENDATION_GRID,
          "items-center bg-muted px-2 text-center text-xs/tight font-bold text-primary xl:text-xs/tight"
        )}
        role="row"
      >
        <span className="py-2 text-left" role="columnheader">
          {t("productNameLabel")}
        </span>
        {COLUMNS.map((column) => {
          const active = sort.key === column.key
          const label = t(column.labelKey)
          return (
            <span
              key={column.key}
              aria-sort={active ? sort.direction : "none"}
              className="border-l border-strong"
              role="columnheader"
            >
              <Button
                variant="unstyled"
                size="unstyled"
                aria-label={t("sortByColumn", { column: label })}
                className="inline-flex w-full items-center justify-center gap-1 py-2"
                type="button"
                onClick={() =>
                  setSort((current) =>
                    toggleRecommendationSort(current, column.key)
                  )
                }
              >
                <span className="truncate">{label}</span>
                {active && <SortIcon className="size-2.5 shrink-0 xl:size-3" />}
              </Button>
            </span>
          )
        })}
      </div>

      <div
        ref={listRef}
        className="min-h-0 overflow-auto bg-subtle p-2"
        role="rowgroup"
      >
        <RecommendationTableBody
          highlightedSkuId={focusedSkuId}
          loading={loading}
          readFailed={readFailed}
          reloading={reloading}
          rows={sortedRows}
          onReload={onReload}
        />
      </div>
    </section>
  )
}
