import { Fragment, type ReactNode } from "react"

import { useTranslation } from "react-i18next"

import {
  getRowLabel,
  type LayoutCabinet,
  type LayoutCell,
  type LayoutRow,
  type ShelfKind,
} from "~/model/shelf"
import { cn } from "~/utils/cn"

const FILL_MIN_CELL_WIDTH = "4rem"

/**
 * One cabinet as labelled rows of cells; the caller renders each cell.
 * `scroll` keeps cells at their own size; `fill` stretches them to the box down to
 * `FILL_MIN_CELL_WIDTH`. Either way the grid scrolls itself and row labels stay put.
 */
export function ShelfGrid({
  cabinet,
  kind,
  layout = "scroll",
  renderCell,
  renderRowEnd,
}: {
  cabinet?: LayoutCabinet
  kind: ShelfKind
  layout?: "scroll" | "fill"
  renderCell: (cell: LayoutCell, row: LayoutRow) => ReactNode
  renderRowEnd?: (row: LayoutRow) => ReactNode
}) {
  const { t } = useTranslation("app")

  if (!cabinet) {
    return (
      <p className="grid min-h-64 place-items-center text-center text-base font-bold text-secondary">
        {t("layoutUnavailable")}
      </p>
    )
  }

  const rowLabel = (row: LayoutRow, className: string) => (
    <div
      key={row.row}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-sm bg-inverse text-center font-bold text-inverse",
        className
      )}
    >
      {getRowLabel(row, kind)}
      <br />
      {t("rowSuffix")}
    </div>
  )

  if (layout === "fill") {
    const rows = {
      gridTemplateRows: `repeat(${cabinet.rows.length}, minmax(0, 1fr))`,
    }
    // Labels sit outside the scroll area so only the cells move sideways. Both
    // sides pad by the same amount so rows line up; the padding keeps lane
    // badges and rings from being clipped.
    return (
      <div className="flex h-full min-w-0 gap-1 xl:gap-2">
        <div className="grid shrink-0 gap-2 py-1.5" style={rows}>
          {cabinet.rows.map((row) =>
            rowLabel(row, "w-8 text-xs/tight xl:w-11 xl:text-sm")
          )}
        </div>
        <div className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden">
          <div
            className="grid h-full min-w-fit gap-2 py-1.5 pr-1.5"
            style={rows}
          >
            {cabinet.rows.map((row) => (
              <div
                key={row.row}
                className="grid min-h-0 gap-1 xl:gap-2"
                style={{
                  gridTemplateColumns: `repeat(${row.cells.length}, minmax(${FILL_MIN_CELL_WIDTH}, 1fr))`,
                }}
              >
                {row.cells.map((cell) => (
                  <Fragment key={cell.id}>{renderCell(cell, row)}</Fragment>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Each label sticks on a strip of the panel's background, so cells
  // scrolling sideways pass under it; rows scroll up and down together.
  return (
    <div className="h-full min-h-0 overflow-auto">
      <div className="grid w-max min-w-full gap-2 py-1.5 pr-1.5">
        {cabinet.rows.map((row) => (
          <div key={row.row} className="flex">
            <div className="sticky left-0 z-10 flex shrink-0 bg-subtle pr-2">
              {rowLabel(row, "w-14 text-lg")}
            </div>
            <div className="grid auto-cols-max grid-flow-col gap-2">
              {row.cells.map((cell) => (
                <Fragment key={cell.id}>{renderCell(cell, row)}</Fragment>
              ))}
            </div>
            {renderRowEnd && (
              <div className="ml-2 flex shrink-0">{renderRowEnd(row)}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
