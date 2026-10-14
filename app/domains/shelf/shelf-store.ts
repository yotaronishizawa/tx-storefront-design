import { create } from "zustand"

import type {
  DisplayManualJob,
  ShelfLocationHistory,
  ShelfSpec,
  Sku,
  SkuRecommendationCounts,
} from "~/api/opm/schemas"
import {
  readStoreSelectionState,
  selectSelectedStore,
} from "~/domains/store-selection"
import {
  createMisplacementCheck,
  findMisplacedStock,
  getErrorLaneIds,
  getLaneErrorBlock,
  groupDisplayShelfLocations,
  groupStockShelfLocations,
  keepConstraintLaneErrors,
  nextLaneErrorSeenOrder,
  type LaneErrorBlock,
  type LayoutCabinet,
  type MisplacedStock,
  type MisplacementCheck,
  type SelectedCell,
  type ShelfLocation,
} from "~/model/shelf"
import type { ShelfClientReport } from "~/model/shelf-client"
import { hasShelfClient } from "~/model/store-display"
import { memoizeOne } from "~/utils/memoize-one"

/** The two shelves and the catalogue behind them. `selectedCell` is shared by every shelf page. */
type ShelfState = {
  displayHistories: ShelfLocationHistory[]
  displayLocations: ShelfLocation[]
  /** The robot's queue while the display page is open; `null` before its first read. */
  displayManualJobs: DisplayManualJob[] | null
  displaySpec: ShelfSpec | null
  /** The edit page's working copy of the display layout. */
  editedDisplayLocations: ShelfLocation[]
  /** Accepted by OPM; retained until a matching registered layout is read. */
  pendingDisplayLayout: ShelfLocation[] | null
  pendingDisplayLayoutIssue: string
  pendingDisplayLayoutNeedCapture: boolean
  layoutStoreId: string
  recommendationCounts: SkuRecommendationCounts
  /** OPM's list could not be read, so it must not be saved over. */
  recommendationCountsReadFailed: boolean
  /** The recommendations page is reading the list again. */
  recommendationCountsReading: boolean
  /** The store the counts were read from; `null` while they are unread. */
  recommendationCountsStoreId: string | null
  /** The cell the board last moved to, selected or not; its cabinet is the one shown. */
  focusedCell: SelectedCell
  selectedCell: SelectedCell
  /** Bumped to ask the board to scroll the selection into view. */
  selectedCellScrollSignal: number
  skus: Sku[]
  /** The shelf client's last report to OPM, or `null` before OPM answers. */
  shelfClientReport: ShelfClientReport | null
  smartShelfConnected: boolean
  stockLocations: ShelfLocation[]
  stockSpec: ShelfSpec | null
  /** The robot rests at the highest cabinet's end, not cabinet 1's. */
  storeMirrored: boolean
  /** Stock lanes the robot could not pick from, offered to the operator to clear; empty when none. */
  stuckLaneIds: string[]
  /** When each red lane went red, so equally urgent ones open oldest first. */
  laneErrorSeenOrder: ReadonlyMap<string, number>
}

type ShelfActions = {
  clearStuckLanes: () => void
  focusCell: (cell: SelectedCell) => void
  /** Moves the board to the cell's cabinet without selecting it, for a lane event. */
  jumpToCell: (cell: SelectedCell) => void
  selectCell: (cell: SelectedCell) => void
  setPendingDisplayLayoutNeedCapture: (needed: boolean) => void
  setPendingDisplayLayoutIssue: (issue: string) => void
  setLayoutStoreId: (storeId: string) => void
  setPendingDisplayLayout: (locations: ShelfLocation[] | null) => void
  setDisplayHistories: (histories: ShelfLocationHistory[]) => void
  setDisplayLocations: (locations: ShelfLocation[]) => void
  setDisplayManualJobs: (jobs: DisplayManualJob[] | null) => void
  setDisplaySpec: (spec: ShelfSpec | null) => void
  setEditedDisplayLocations: (locations: ShelfLocation[]) => void
  /** Empties the list and marks it unread. */
  failRecommendationCountsRead: () => void
  setRecommendationCounts: (
    counts: SkuRecommendationCounts,
    storeId: string
  ) => void
  setRecommendationCountsReading: (reading: boolean) => void
  setSkus: (skus: Sku[]) => void
  setShelfClientReport: (report: ShelfClientReport | null) => void
  setSmartShelfConnected: (connected: boolean) => void
  setStockLocations: (locations: ShelfLocation[]) => void
  setStockSpec: (spec: ShelfSpec | null) => void
  setStoreMirrored: (mirrored: boolean) => void
  /** Ignored while an offer is already open, so a poll cannot replace what the operator is reading. */
  offerStuckLanes: (locationIds: string[]) => void
}

const INITIAL_STATE: ShelfState = {
  displayHistories: [],
  displayLocations: [],
  displayManualJobs: null,
  displaySpec: null,
  editedDisplayLocations: [],
  pendingDisplayLayout: null,
  pendingDisplayLayoutIssue: "",
  pendingDisplayLayoutNeedCapture: false,
  layoutStoreId: "",
  recommendationCounts: {},
  recommendationCountsReadFailed: false,
  recommendationCountsReading: false,
  recommendationCountsStoreId: null,
  focusedCell: null,
  selectedCell: null,
  selectedCellScrollSignal: 0,
  shelfClientReport: null,
  skus: [],
  smartShelfConnected: false,
  stockLocations: [],
  stockSpec: null,
  storeMirrored: false,
  stuckLaneIds: [],
  laneErrorSeenOrder: new Map(),
}

export const useShelfStore = create<ShelfState & ShelfActions>((set) => ({
  ...INITIAL_STATE,

  clearStuckLanes: () => set({ stuckLaneIds: [] }),
  focusCell: (selectedCell) =>
    set((state) => ({
      focusedCell: selectedCell,
      selectedCell,
      selectedCellScrollSignal: state.selectedCellScrollSignal + 1,
    })),
  jumpToCell: (focusedCell) =>
    set((state) => ({
      focusedCell,
      selectedCellScrollSignal: state.selectedCellScrollSignal + 1,
    })),
  selectCell: (selectedCell) => set({ selectedCell }),
  setPendingDisplayLayoutNeedCapture: (pendingDisplayLayoutNeedCapture) =>
    set({ pendingDisplayLayoutNeedCapture }),
  setPendingDisplayLayoutIssue: (pendingDisplayLayoutIssue) =>
    set({ pendingDisplayLayoutIssue }),
  setLayoutStoreId: (layoutStoreId) => set({ layoutStoreId }),
  setPendingDisplayLayout: (pendingDisplayLayout) =>
    set({ pendingDisplayLayout }),
  setDisplayHistories: (displayHistories) => set({ displayHistories }),
  setDisplayLocations: (displayLocations) => set({ displayLocations }),
  setDisplayManualJobs: (displayManualJobs) => set({ displayManualJobs }),
  setDisplaySpec: (displaySpec) => set({ displaySpec }),
  setEditedDisplayLocations: (editedDisplayLocations) =>
    set({ editedDisplayLocations }),
  failRecommendationCountsRead: () =>
    set({
      recommendationCounts: {},
      recommendationCountsReadFailed: true,
      recommendationCountsStoreId: null,
    }),
  setRecommendationCounts: (
    recommendationCounts,
    recommendationCountsStoreId
  ) =>
    set({
      recommendationCounts,
      recommendationCountsReadFailed: false,
      recommendationCountsStoreId,
    }),
  setRecommendationCountsReading: (recommendationCountsReading) =>
    set({ recommendationCountsReading }),
  setSkus: (skus) => set({ skus }),
  setShelfClientReport: (shelfClientReport) => set({ shelfClientReport }),
  setSmartShelfConnected: (smartShelfConnected) => set({ smartShelfConnected }),
  setStockLocations: (locations) =>
    set((state) => {
      const stockLocations = scopeLaneErrorsToStore(locations)
      return {
        stockLocations,
        laneErrorSeenOrder: nextLaneErrorSeenOrder(
          state.laneErrorSeenOrder,
          stockLocations
        ),
      }
    }),
  setStockSpec: (stockSpec) => set({ stockSpec }),
  setStoreMirrored: (storeMirrored) => set({ storeMirrored }),
  offerStuckLanes: (locationIds) =>
    set((state) =>
      state.stuckLaneIds.length > 0 || locationIds.length === 0
        ? state
        : { stuckLaneIds: locationIds }
    ),
}))

/**
 * Scoped on the way in, so every reader agrees: without a shelf client only the
 * constraint lane errors apply.
 */
function scopeLaneErrorsToStore(locations: ShelfLocation[]): ShelfLocation[] {
  const store = selectSelectedStore(readStoreSelectionState())
  return hasShelfClient(store) ? locations : keepConstraintLaneErrors(locations)
}

// Derived selectors allocate, so each is memoised to keep subscribers from re-rendering on unrelated changes.
const buildSkuById = memoizeOne((skus: Sku[]) => {
  const map = new Map<string, Sku>()
  for (const sku of skus) {
    map.set(sku.id, sku)
  }
  return map
})

const buildDisplayBoard = memoizeOne(groupDisplayShelfLocations)
const buildEditedDisplayBoard = memoizeOne(groupDisplayShelfLocations)
const buildStockBoard = memoizeOne(groupStockShelfLocations)

export function selectSkuById(state: ShelfState): Map<string, Sku> {
  return buildSkuById(state.skus)
}

export function selectDisplayBoard(state: ShelfState): LayoutCabinet[] {
  return buildDisplayBoard(state.displayLocations, state.displaySpec)
}

/** The edit page's board, from its working copy. Its own memo, so it does not thrash `selectDisplayBoard`'s. */
export function selectEditedDisplayBoard(state: ShelfState): LayoutCabinet[] {
  return buildEditedDisplayBoard(
    state.editedDisplayLocations,
    state.displaySpec
  )
}

export function selectStockBoard(state: ShelfState): LayoutCabinet[] {
  return buildStockBoard(state.stockLocations, state.stockSpec)
}

const buildMisplacementCheck = memoizeOne(createMisplacementCheck)
const buildMisplacedStock = memoizeOne(findMisplacedStock)

/** Rebuilt only when the display layout or catalogue changes. */
export function selectMisplacementCheck(state: ShelfState): MisplacementCheck {
  return buildMisplacementCheck(state.displayLocations, selectSkuById(state))
}

export function selectMisplacedStock(state: ShelfState): MisplacedStock {
  return buildMisplacedStock(
    state.stockLocations,
    selectMisplacementCheck(state)
  )
}

const buildLaneErrorBlock = memoizeOne(getLaneErrorBlock)

export function selectLaneErrorBlock(state: ShelfState): LaneErrorBlock {
  return buildLaneErrorBlock(state.stockLocations)
}

const buildErrorLaneIds = memoizeOne(getErrorLaneIds)

/** The red lanes, the one to fix first leading. */
export function selectErrorLaneIds(state: ShelfState): string[] {
  return buildErrorLaneIds(state.stockLocations, state.laneErrorSeenOrder)
}

export function readShelfState(): ShelfState & ShelfActions {
  return useShelfStore.getState()
}

export function resetShelfStore() {
  useShelfStore.setState(INITIAL_STATE)
}
