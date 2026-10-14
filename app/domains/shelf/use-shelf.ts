import { useMemo } from "react"

import type {
  DisplayManualJob,
  ShelfLocationHistory,
  ShelfSpec,
  Sku,
  SkuRecommendationCounts,
} from "~/api/opm/schemas"
import { useSelectedStoreId } from "~/domains/store-selection"
import type {
  LaneErrorBlock,
  LayoutCabinet,
  LayoutDraftStorage,
  MisplacedStock,
  SelectedCell,
  ShelfLocation,
} from "~/model/shelf"

import {
  selectDisplayBoard,
  selectEditedDisplayBoard,
  selectErrorLaneIds,
  selectLaneErrorBlock,
  selectMisplacedStock,
  selectSkuById,
  selectStockBoard,
  useShelfStore,
} from "./shelf-store"
import {
  clearLayoutDraft,
  readLayoutDraft,
  saveLayoutDraft,
} from "./storage/layout-draft-storage"

export function useSkus(): Sku[] {
  return useShelfStore((state) => state.skus)
}

export function useSkuById(): Map<string, Sku> {
  return useShelfStore(selectSkuById)
}

export function useDisplayBoard(): LayoutCabinet[] {
  return useShelfStore(selectDisplayBoard)
}

export function useStockBoard(): LayoutCabinet[] {
  return useShelfStore(selectStockBoard)
}

/** False until the store's stock lanes have arrived. */
export function useStockLocationsLoaded(): boolean {
  return useShelfStore((state) => state.stockLocations.length > 0)
}

export function useLaneErrorBlock(): LaneErrorBlock {
  return useShelfStore(selectLaneErrorBlock)
}

export function useErrorLaneIds(): string[] {
  return useShelfStore(selectErrorLaneIds)
}

export function useStockLocations(): ShelfLocation[] {
  return useShelfStore((state) => state.stockLocations)
}

export function useMisplacedStock(): MisplacedStock {
  return useShelfStore(selectMisplacedStock)
}

export function useDisplaySpec(): ShelfSpec | null {
  return useShelfStore((state) => state.displaySpec)
}

export function useStoreMirrored(): boolean {
  return useShelfStore((state) => state.storeMirrored)
}

export function useDisplayLocations(): ShelfLocation[] {
  return useShelfStore((state) => state.displayLocations)
}

export function useDisplayHistories(): ShelfLocationHistory[] {
  return useShelfStore((state) => state.displayHistories)
}

export function useDisplayManualJobs(): DisplayManualJob[] | null {
  return useShelfStore((state) => state.displayManualJobs)
}

export function useStuckLaneIds(): string[] {
  return useShelfStore((state) => state.stuckLaneIds)
}

export function useRecommendationCounts(): SkuRecommendationCounts {
  return useShelfStore((state) => state.recommendationCounts)
}

export function useRecommendationCountsReadFailed(): boolean {
  return useShelfStore((state) => state.recommendationCountsReadFailed)
}

export function useRecommendationCountsReading(): boolean {
  return useShelfStore((state) => state.recommendationCountsReading)
}

/** The edit page's working copy, and the board derived from it. */
export function useDisplayLayoutDraft() {
  const editedDisplayLocations = useShelfStore(
    (state) => state.editedDisplayLocations
  )
  const editedDisplayBoard = useShelfStore(selectEditedDisplayBoard)
  const pendingDisplayLayoutNeedCapture = useShelfStore(
    (state) => state.pendingDisplayLayoutNeedCapture
  )
  const pendingDisplayLayoutIssue = useShelfStore(
    (state) => state.pendingDisplayLayoutIssue
  )
  const pendingDisplayLayout = useShelfStore(
    (state) => state.pendingDisplayLayout
  )
  const setEditedDisplayLocations = useShelfStore(
    (state) => state.setEditedDisplayLocations
  )

  const storeId = useSelectedStoreId()
  const draftStorage = useMemo<LayoutDraftStorage>(
    () => ({
      read: () => readLayoutDraft(storeId),
      save: (draft) => saveLayoutDraft(storeId, draft),
      clear: () => clearLayoutDraft(storeId),
    }),
    [storeId]
  )

  return {
    draftStorage,
    editedDisplayBoard,
    pendingDisplayLayout,
    pendingDisplayLayoutIssue,
    pendingDisplayLayoutNeedCapture,
    editedDisplayLocations,
    setEditedDisplayLocations,
  }
}

/** Which cell is selected, and the signal that asks a board to scroll to it. */
export function useShelfSelection(): {
  focusedCell: SelectedCell
  selectCell: (cell: SelectedCell) => void
  selectedCell: SelectedCell
  selectedCellScrollSignal: number
} {
  const focusedCell = useShelfStore((state) => state.focusedCell)
  const selectedCell = useShelfStore((state) => state.selectedCell)
  const selectedCellScrollSignal = useShelfStore(
    (state) => state.selectedCellScrollSignal
  )
  const selectCell = useShelfStore((state) => state.selectCell)

  return { focusedCell, selectCell, selectedCell, selectedCellScrollSignal }
}

export function useSmartShelfConnected() {
  return useShelfStore((state) => state.smartShelfConnected)
}
