import type { Sku } from "~/api/opm/schemas"
import { ProductThumb } from "~/components/product/product-thumb"
import { Button } from "~/core"
import {
  getCellDisplaySkuIds,
  getCellSkuIds,
  isLocationUnused,
  type LayoutCabinet,
  type LayoutCell,
} from "~/model/shelf"
import { cn } from "~/utils/cn"

export type BoardLaneMarks = {
  errorCellIds: ReadonlySet<string>
  /** Lanes holding the drink being looked up. */
  foundCellIds: ReadonlySet<string>
  selectedCellId: string
  targetCellId: string
}

/**
 * One stock cabinet on the restock study's whole-shelf screen, at the real
 * 608 × 898 proportions (the parent sets the size). Like the guide's shelf,
 * it shows only what the real shelf shows (drinks, gaps), and colours only
 * what this screen is for: lanes to fix, lanes not in use, where the drink in
 * hand goes, mixed lanes and a looked-up drink. Every lane opens its detail.
 */
export function BoardShelfFront({
  cabinet,
  marks,
  skuById,
  onSelect,
}: {
  cabinet: LayoutCabinet
  marks: BoardLaneMarks
  skuById: Map<string, Sku>
  onSelect: (cellId: string) => void
}) {
  return (
    <div className="flex h-full flex-col gap-1.5 rounded-lg border-4 border-strong bg-subtle p-1.5">
      {cabinet.rows.map((row) => (
        <div key={row.row} className="flex min-h-0 flex-1 gap-0.5">
          {[...row.cells]
            .sort((left, right) => left.column - right.column)
            .map((cell) => (
              <BoardLane
                key={cell.id}
                cell={cell}
                marks={marks}
                skuById={skuById}
                onSelect={onSelect}
              />
            ))}
        </div>
      ))}
    </div>
  )
}

function BoardLane({
  cell,
  marks,
  skuById,
  onSelect,
}: {
  cell: LayoutCell
  marks: BoardLaneMarks
  skuById: Map<string, Sku>
  onSelect: (cellId: string) => void
}) {
  const unused = Boolean(cell.location && isLocationUnused(cell.location))
  const skuId = getCellDisplaySkuIds(cell, skuById)[0] ?? ""
  const mixed = new Set(getCellSkuIds(cell)).size > 1
  const error = marks.errorCellIds.has(cell.id)
  return (
    <Button
      className={cn(
        "relative flex min-w-0 flex-1 items-end justify-center rounded-sm border-2 border-transparent bg-default p-0",
        unused && "bg-muted",
        cell.id === marks.targetCellId && "border-success bg-success-subtle",
        marks.foundCellIds.has(cell.id) && "border-primary bg-primary-subtle",
        error && "border-error bg-error-subtle",
        cell.id === marks.selectedCellId && "ring-3 ring-primary"
      )}
      disabled={cell.isEmpty}
      size="unstyled"
      type="button"
      variant="unstyled"
      onClick={() => onSelect(cell.id)}
    >
      {skuId && !unused && (
        <ProductThumb className="h-[80%] w-full" sku={skuById.get(skuId)} />
      )}
      {mixed && !unused && (
        <span
          aria-hidden
          className="absolute top-0.5 right-0.5 size-2 rounded-full bg-warning"
        />
      )}
    </Button>
  )
}
