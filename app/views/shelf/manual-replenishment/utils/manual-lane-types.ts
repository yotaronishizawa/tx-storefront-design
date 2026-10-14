import type { SelectedCell } from "~/model/shelf"

// Same shape as `useShelfSelection()`, so a route can pass it straight through.
export type ShelfSelection = {
  selectedCell: SelectedCell
  selectedCellScrollSignal: number
  selectCell: (cell: SelectedCell) => void
}
