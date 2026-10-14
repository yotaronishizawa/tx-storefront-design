import type {
  LayoutCabinet,
  LayoutCell,
  LayoutRow,
  SelectedCell,
  ShelfKind,
} from "./board"
import { getCellSkuId } from "./layout-cells"

export function getBoardCells(board: LayoutCabinet[]): LayoutCell[] {
  return board.flatMap((cabinet) => cabinet.rows.flatMap((row) => row.cells))
}

export function findCell(
  board: LayoutCabinet[],
  cellId: string
): LayoutCell | undefined {
  return getBoardCells(board).find((cell) => cell.id === cellId)
}

export function findRow(
  board: LayoutCabinet[],
  cellId: string
): LayoutRow | undefined {
  return board
    .flatMap((cabinet) => cabinet.rows)
    .find((row) => row.cells.some((cell) => cell.id === cellId))
}

export function isDisplayCellSelected(
  selectedCell: SelectedCell,
  cell: LayoutCell
): boolean {
  return selectedCell?.kind === "display" && selectedCell.id === cell.id
}

/**
 * A lane holding a SKU the catalogue does not know, so it has no product to show.
 * An empty lane is not one.
 *
 * @example isLaneSkuUnknown({ location: { id: "l1", skuId: "s9" } } as LayoutCell, new Map()) // true
 * @example isLaneSkuUnknown({ location: { id: "l1" } } as LayoutCell, new Map()) // false
 */
export function isLaneSkuUnknown(
  cell: LayoutCell,
  skuById: ReadonlyMap<string, unknown>
): boolean {
  const skuId = getCellSkuId(cell, "display")
  return skuId !== "" && !skuById.has(skuId)
}

export function countLocations(board: LayoutCabinet[]): number {
  return getBoardCells(board).filter((cell) => cell.location).length
}

// Display rows are 0-based in the data, stock rows 1-based.
export function getRowLabel(row: LayoutRow, kind: ShelfKind): number {
  return kind === "display" ? row.row + 1 : row.row
}

// Stock lanes are numbered from the far side, so their columns count down.
export function getColumnLabel(
  cell: LayoutCell,
  row: LayoutRow,
  kind: ShelfKind
): number {
  const columns = row.cells.map((c) => c.column).filter(Number.isFinite)
  if (kind !== "stock" || columns.length === 0) {
    return cell.column
  }

  return Math.min(...columns) + Math.max(...columns) - cell.column
}
