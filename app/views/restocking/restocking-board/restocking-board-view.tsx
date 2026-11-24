import { useMemo, useState } from "react"

import { Search } from "lucide-react"
import { useTranslation } from "react-i18next"

import type {
  RequestContext,
  Sku,
  SkuRecommendationCounts,
  StockDrinkRemoval,
} from "~/api/opm/schemas"
import { MessageDialog } from "~/components/dialog/message-dialog"
import { PanelTitle } from "~/components/layout/panel-title"
import { ProductSearchDialog } from "~/components/product/product-search-dialog"
import {
  RobotArmControl,
  type RobotArmControlProps,
} from "~/components/robot/robot-arm-control"
import { CabinetTabs } from "~/components/shelf/cabinet-tabs"
import { LaneDetailDrawer } from "~/components/shelf/lane-detail/lane-detail-drawer"
import { ShelfGrid } from "~/components/shelf/shelf-grid"
import { LaneLegend } from "~/components/shelf/stock-lane/lane-legend"
import { getPresentLaneStates } from "~/components/shelf/stock-lane/lane-states"
import { StockLane } from "~/components/shelf/stock-lane/stock-lane"
import { summarizeCabinets } from "~/components/shelf/summarize-cabinets"
import { useActiveCabinet } from "~/components/shelf/use-active-cabinet"
import { FEATURES } from "~/config/feature"
import { getRestockVariant } from "~/config/restock-study"
import { Button } from "~/core"
import type { TakeOutItemView } from "~/domains/restocking"
import { useCurrentTime } from "~/hooks/use-current-time"
import { isRequestInProgress } from "~/model/request-state"
import type { StockRemovalBlock } from "~/model/robot-status"
import {
  countCurrentStockBySku,
  countLaneSku,
  countMisplacedDrinks,
  createRecommendationRows,
  describeGuideLane,
  findAgedLaneIds,
  findCell,
  findRow,
  getBoardCells,
  getCellSkuIds,
  getColumnLabel,
  getLaneErrorSummary,
  getShelfPosition,
  planSkuRemoval,
  type AgedStockRule,
  type LaneMarks,
  type LayoutCabinet,
  type RestockEntryItemView,
  type RestockGuideView,
  type RestockingPlacementState,
  type SelectedCell,
} from "~/model/shelf"
import type { BusyAction } from "~/types/busy-action"
import { cn } from "~/utils/cn"

import { RecommendationTable } from "./components/recommendation-table"
import { RestockBoardScreen } from "./components/restock-board-screen"
import { RestockEntryScreen } from "./components/restock-entry-screen"
import { RestockGuideCard } from "./components/restock-guide-card"
import { RestockGuideScreen } from "./components/restock-guide-screen"
import { RestockVariantBScreen } from "./components/restock-variant-b-screen"
import { RestockingActionButton } from "./components/restocking-action-button"
import { ScannedDrinkCard } from "./components/scanned-drink-card"
import { ScannedDrinkLine } from "./components/scanned-drink-line"
import { SkuRemovalPanel } from "./components/sku-removal-panel"
import { useGuideWords } from "./components/use-guide-words"

const NO_LANE_IDS: ReadonlySet<string> = new Set()

function isNeverMisplaced() {
  return false
}

export function RestockingBoardView({
  robotArm,
  agedStockRule,
  board,
  busyAction,
  errorFixRequest,
  errorLaneIds,
  isMisplacedSku,
  laneAddedCounts,
  laneDrawerId,
  laneMarks,
  laneSwitchPromptOpen,
  lastAddedLaneId,
  misplacedLaneIds,
  recommendations,
  recommendationsReadFailed,
  recommendationsLoading,
  removalBlock,
  restockingPlacement,
  restockRequest,
  entryItems,
  takeOutItems,
  focusedCell,
  guide,
  selectedCell,
  selectedCellScrollSignal,
  skuById,
  onCancelLaneSwitch,
  onCheckLaneMatched,
  onRecoverLane,
  onCloseLane,
  onEndRestocking,
  onFinishLaneRemoval,
  onLaneMarksChange,
  onOpenLane,
  onReloadRecommendations,
  onRemoveSku,
  onRequestCloseLane,
  onStartRestocking,
}: {
  /** "Move the robot up or down", beside the screen's other actions. */
  robotArm: RobotArmControlProps
  agedStockRule?: AgedStockRule
  board: LayoutCabinet[]
  busyAction: BusyAction
  /** The red lanes, the one to fix first leading. */
  errorLaneIds: string[]
  /** Restock study: "Fix the lane" on the error popup, leading with its lane. */
  errorFixRequest?: { laneId: string } | null
  isMisplacedSku: (skuId: string) => boolean
  laneAddedCounts: ReadonlyMap<string, number>
  laneDrawerId: string
  laneMarks: LaneMarks
  laneSwitchPromptOpen: boolean
  lastAddedLaneId: string
  misplacedLaneIds: ReadonlySet<string>
  recommendations: SkuRecommendationCounts
  recommendationsReadFailed: boolean
  /** The list is still being read; an empty table then means "loading", not "nothing needed". */
  recommendationsLoading: boolean
  removalBlock: StockRemovalBlock
  restockingPlacement?: RestockingPlacementState
  restockRequest?: RequestContext
  /** The lane the board last moved to; its cabinet is shown. */
  focusedCell: SelectedCell
  /** Restock study: where the scanned drink goes. */
  guide?: RestockGuideView
  /** Restock study: what to bring before entering, and where it goes. */
  entryItems?: RestockEntryItemView[]
  /** Study: drinks to take out, listed beside the ones to restock. */
  takeOutItems?: TakeOutItemView[]
  selectedCell: SelectedCell
  selectedCellScrollSignal?: number
  skuById: Map<string, Sku>
  onCancelLaneSwitch: () => void
  onCheckLaneMatched: (locationId: string) => Promise<boolean>
  /** Restock study: the recovery steps for a red lane that stays red. */
  onRecoverLane: (laneId: string) => void
  onCloseLane: () => void
  onEndRestocking: () => void
  onFinishLaneRemoval: (
    locationId: string,
    removals: StockDrinkRemoval[]
  ) => void
  onLaneMarksChange: (marks: LaneMarks) => void
  /** Ignored for a lane the operator may not open now. */
  onOpenLane: (laneId: string) => void
  onReloadRecommendations: () => void
  /** Takes every drink of one SKU off the stock shelf. */
  onRemoveSku: (skuId: string) => Promise<boolean>
  onRequestCloseLane: () => void
  onStartRestocking: () => void
}) {
  const { t } = useTranslation(["app", "common"])

  // Looking a drink up for removal; `picking` while the product search is open.
  const [skuRemoval, setSkuRemoval] = useState<{
    picking: boolean
    skuId: string
  } | null>(null)
  const [pickerSearch, setPickerSearch] = useState("")
  // Held for the whole lane-by-lane run.
  const [removingSku, setRemovingSku] = useState(false)
  const [noStockOpen, setNoStockOpen] = useState(false)
  // The drink the full board was asked for over the guide; a new scan brings the guide back.
  const [boardSkuId, setBoardSkuId] = useState("")
  // The list was asked for over the guide; a new scan or placement brings the guide back.
  const [listAskedAt, setListAskedAt] = useState("")
  // The full board was asked for over the before-entry list.
  const [entryBoardShown, setEntryBoardShown] = useState(false)
  // The red lanes were asked for: the guide shows them, one at a time, until none is left.
  const [fixAsked, setFixAsked] = useState(false)
  // The lane the error popup named, fixed first; "" leads with the first red lane.
  const [fixLaneId, setFixLaneId] = useState("")
  const [seenFixRequest, setSeenFixRequest] = useState(errorFixRequest)
  if (errorFixRequest !== seenFixRequest) {
    setSeenFixRequest(errorFixRequest)
    if (errorFixRequest) {
      setFixLaneId(errorFixRequest.laneId)
      setFixAsked(true)
    }
  }
  function askFix() {
    setFixLaneId("")
    setFixAsked(true)
  }
  // Restock study: a drink looked up on the whole-shelf screen, and its picker.
  const [foundSkuId, setFoundSkuId] = useState("")
  const [findPicking, setFindPicking] = useState(false)
  const restocking = isRequestInProgress(restockRequest)
  // Starting restocking ends a lookup.
  if (restocking && skuRemoval) {
    setSkuRemoval(null)
  }
  const removalSkuId = skuRemoval?.skuId ?? ""
  const selectedId = selectedCell?.kind === "stock" ? selectedCell.id : ""
  const focusedId = focusedCell?.kind === "stock" ? focusedCell.id : ""
  const [cabinet, setCabinet] = useActiveCabinet(
    board,
    findCell(board, focusedId)?.cabinet,
    selectedCellScrollSignal
  )
  const recommendationRows = useMemo(
    () =>
      createRecommendationRows(recommendations, getBoardCells(board), skuById),
    [board, recommendations, skuById]
  )
  const scannedSkuId = restockingPlacement?.scannedSkuId ?? ""
  const scannedCurrentCount = useMemo(() => {
    if (!scannedSkuId) {
      return 0
    }
    const stock = countCurrentStockBySku(getBoardCells(board), skuById)
    return stock.get(scannedSkuId) ?? 0
  }, [board, scannedSkuId, skuById])
  // The picker searches the whole catalogue, not just what is stocked.
  const allSkus = useMemo(() => [...skuById.values()], [skuById])
  const stockLocations = useMemo(
    () => getBoardCells(board).flatMap((cell) => cell.location ?? []),
    [board]
  )
  // Every lane, unused ones included: the count is what Remove all takes out.
  function countSkuStock(skuId: string) {
    return planSkuRemoval(stockLocations, skuId).reduce(
      (total, lane) => total + lane.removals.length,
      0
    )
  }
  const removalCount = removalSkuId ? countSkuStock(removalSkuId) : 0
  const now = useCurrentTime()
  // No placement hints while a red lane blocks scanning, and no aged or
  // misplaced marks while a restock is in progress.
  const hasErrorLanes = errorLaneIds.length > 0
  if (fixAsked && !hasErrorLanes) {
    setFixAsked(false)
  }
  // The lane to fix first leads `errorLaneIds`, unless the popup named one.
  const fixLaneFirst = errorLaneIds.includes(fixLaneId)
    ? fixLaneId
    : (errorLaneIds[0] ?? "")
  const fixCell = fixAsked ? findCell(board, fixLaneFirst) : undefined
  // The guide replaces "every lane it fits" with one lane. It stays while red
  // lanes are left, and says so.
  const shownGuide = guide
  const errorCountByCabinet = useMemo(() => {
    const counts = new Map<number, number>()
    for (const laneId of errorLaneIds) {
      const cabinetNumber = findCell(board, laneId)?.cabinet
      if (cabinetNumber !== undefined) {
        counts.set(cabinetNumber, (counts.get(cabinetNumber) ?? 0) + 1)
      }
    }
    return counts
  }, [board, errorLaneIds])
  const boardPlacement =
    hasErrorLanes || shownGuide ? undefined : restockingPlacement
  function getGuideRole(cellId: string, row: number) {
    const target = shownGuide?.target
    if (!target) {
      return undefined
    }
    if (cellId === target.cellId) {
      return "target"
    }
    if (shownGuide.nextCellIds.includes(cellId)) {
      return "next"
    }
    return row === target.row ? undefined : "dimmed"
  }
  const agedLaneIds = useMemo(() => {
    if (restocking) {
      return NO_LANE_IDS
    }
    return findAgedLaneIds(board, skuById, agedStockRule, now)
  }, [agedStockRule, board, now, restocking, skuById])
  const shownMisplacedLaneIds = restocking ? NO_LANE_IDS : misplacedLaneIds
  const cabinetSummaries = useMemo(
    () =>
      summarizeCabinets(board, skuById, {
        laneAddedCounts,
        misplacedLaneIds: shownMisplacedLaneIds,
        removalSkuId,
      }),
    [board, laneAddedCounts, removalSkuId, shownMisplacedLaneIds, skuById]
  )
  const presentLaneStates = useMemo(
    () =>
      // Every cabinet, so a state on another tab still shows.
      getPresentLaneStates(getBoardCells(board), {
        addedCounts: laneAddedCounts,
        agedLaneIds,
        lastAddedLaneId,
        misplacedLaneIds: shownMisplacedLaneIds,
        restockingPlacement: boardPlacement,
      }),
    [
      agedLaneIds,
      boardPlacement,
      board,
      laneAddedCounts,
      lastAddedLaneId,
      shownMisplacedLaneIds,
    ]
  )
  // Counted over every cabinet.
  const totalDrinks = [...cabinetSummaries.values()].reduce(
    (total, summary) => total + summary.drinkCount,
    0
  )
  const notOnDisplayDrinks = useMemo(
    () =>
      countMisplacedDrinks(
        board,
        skuById,
        shownMisplacedLaneIds,
        isMisplacedSku
      ),
    [board, isMisplacedSku, shownMisplacedLaneIds, skuById]
  )
  const detailCell = findCell(board, laneDrawerId)
  const detailRow = findRow(board, laneDrawerId)
  const words = useGuideWords(skuById)
  // The study names the open lane as the guide does, not by its numbers.
  const detailSkuId = detailCell ? (getCellSkuIds(detailCell)[0] ?? "") : ""
  const detailHeading =
    entryItems && detailCell
      ? words.place(
          getShelfPosition(board, detailCell.cabinet),
          describeGuideLane(board, detailCell, detailSkuId),
          detailSkuId
        )
      : undefined
  const detailColumnLabel =
    detailCell && detailRow ? getColumnLabel(detailCell, detailRow, "stock") : 0
  const showAgedNotice =
    agedStockRule !== undefined && agedLaneIds.size > 0 && !hasErrorLanes

  // Send waits for every red lane: one sent unfixed is a discrepancy. In the
  // study there is no start here: restocking starts from Home.
  const actionButton = entryItems && !restocking ? null : (
    <RestockingActionButton
      blocked={Boolean(skuRemoval) || (restocking && hasErrorLanes)}
      busyAction={busyAction}
      restockRequest={restockRequest}
      size={entryItems ? "lg" : "sm"}
      onEndRestocking={onEndRestocking}
      onStartRestocking={onStartRestocking}
    />
  )

  const placementKey = lastAddedLaneId
    ? `${lastAddedLaneId}:${laneAddedCounts.get(lastAddedLaneId) ?? 0}`
    : ""
  // Going back to the list holds until the next drink placed or scanned.
  const guideKey = shownGuide
    ? `${shownGuide.skuId}|${shownGuide.scanKey}|${placementKey}`
    : ""
  // The guide leads while a drink is still wanted; between cases, or when
  // asked for, the list does.
  const guiding =
    restocking && shownGuide && !shownGuide.done && listAskedAt !== guideKey

  // Restock study: red lanes are put right on the guide itself, not the whole board.
  if (restocking && entryItems && fixCell) {
    return (
      <RestockGuideScreen
        cabinets={board}
        errorCountByCabinet={errorCountByCabinet}
        fix={{
          cell: fixCell,
          left: errorLaneIds.length,
          otherCellIds: errorLaneIds.filter((id) => id !== fixLaneFirst),
          summary: getLaneErrorSummary(fixCell.location),
          onRecover: () => onRecoverLane(fixCell.id),
        }}
        scannedDrink={null}
        skuById={skuById}
        onFixErrors={askFix}
        onShowGuide={guiding ? () => setFixAsked(false) : undefined}
        onShowList={() => {
          setFixAsked(false)
          setListAskedAt(guideKey)
          setEntryBoardShown(false)
        }}
      />
    )
  }

  // Restock study, variant B: Masaya's one screen in place of the list and the
  // guide once restocking runs; before it, and for red lanes, as in A.
  if (
    restocking &&
    entryItems &&
    getRestockVariant() === "b" &&
    !entryBoardShown
  ) {
    return (
      <RestockVariantBScreen
        actions={actionButton}
        board={board}
        cabinetSummaries={cabinetSummaries}
        currentCount={scannedCurrentCount}
        laneAddedCounts={laneAddedCounts}
        lastAddedLaneId={lastAddedLaneId}
        placement={hasErrorLanes ? undefined : restockingPlacement}
        presentLaneStates={presentLaneStates}
        robotArm={<RobotArmControl {...robotArm} size="lg" />}
        row={recommendationRows.find((item) => item.skuId === scannedSkuId)}
        sku={skuById.get(scannedSkuId)}
        skuById={skuById}
        // Scanned in this visit only, as A's guide.
        skuId={shownGuide?.skuId ?? ""}
        onOpenLane={onOpenLane}
        onShowBoard={() => setEntryBoardShown(true)}
      />
    )
  }

  if (!guiding && entryItems && !entryBoardShown && !skuRemoval) {
    return (
      <RestockEntryScreen
        actions={
          <>
            <RobotArmControl {...robotArm} size="lg" />
            {actionButton}
          </>
        }
        errorCount={errorLaneIds.length}
        items={entryItems}
        takeOutItems={takeOutItems}
        restocking={restocking}
        scanned={
          restocking && shownGuide
            ? { skuId: shownGuide.skuId, enough: shownGuide.done }
            : undefined
        }
        skuById={skuById}
        onFixErrors={askFix}
        onShowBoard={() => setEntryBoardShown(true)}
        onShowGuide={() => setListAskedAt("")}
      />
    )
  }

  if (guiding && boardSkuId !== shownGuide.skuId) {
    return (
      <RestockGuideScreen
        cabinets={board}
        errorCountByCabinet={errorCountByCabinet}
        lastPlacement={
          lastAddedLaneId
            ? { cellId: lastAddedLaneId, key: placementKey }
            : undefined
        }
        guide={shownGuide}
        scannedDrink={
          <ScannedDrinkLine
            remaining={shownGuide.target?.remaining.count}
            sku={skuById.get(scannedSkuId)}
            skuId={scannedSkuId}
          />
        }
        skuById={skuById}
        onFixErrors={askFix}
        onShowList={() => {
          setListAskedAt(guideKey)
          setEntryBoardShown(false)
        }}
      />
    )
  }

  // Restock study: its own whole-shelf screen in place of this board.
  const studyBoard = entryItems !== undefined

  return (
    <section
      className={cn(
        "grid min-h-0 min-w-0 flex-1 gap-3",
        studyBoard
          ? "grid-rows-[minmax(0,1fr)]"
          : "grid-rows-[auto_minmax(0,1fr)]"
      )}
    >
      {studyBoard ? (
        <RestockBoardScreen
          actions={
            <>
              <RobotArmControl {...robotArm} size="lg" />
              {actionButton}
            </>
          }
          backLabel={
            guiding ? t("restockGuideShowGuide") : t("restockEntryBack")
          }
          cabinets={board}
          errorLaneIds={errorLaneIds}
          foundSkuId={foundSkuId}
          selectedCellId={laneDrawerId}
          skuById={skuById}
          targetCellId={(guiding && shownGuide.target?.cellId) || ""}
          onBack={() =>
            guiding ? setBoardSkuId("") : setEntryBoardShown(false)
          }
          onClearFound={() => setFoundSkuId("")}
          onFind={() => setFindPicking(true)}
          onSelectLane={onOpenLane}
        />
      ) : (
        <>
          <div className="grid shrink-0 grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1fr)_auto]">
            <CabinetTabs
              board={board}
              kind="stock"
              summaries={cabinetSummaries}
              value={cabinet?.cabinet}
              onChange={setCabinet}
            />

            <div className={cn("grid gap-2", "grid-flow-col")}>
              {!guiding && entryItems && (
                <Button
                  size="sm"
                  type="button"
                  variant="secondary"
                  onClick={() => setEntryBoardShown(false)}
                >
                  {t("restockEntryBack")}
                </Button>
              )}
              {guiding && (
                <Button
                  size="sm"
                  type="button"
                  variant="secondary"
                  onClick={() => setBoardSkuId("")}
                >
                  {t("restockGuideShowGuide")}
                </Button>
              )}
              <RobotArmControl {...robotArm} />
              {!restocking && (
                <Button
                  disabled={Boolean(skuRemoval)}
                  icon={<Search />}
                  size="sm"
                  type="button"
                  variant="secondary"
                  onClick={() => setSkuRemoval({ picking: true, skuId: "" })}
                >
                  {t("skuRemovalFind")}
                </Button>
              )}
              {/* A lookup holds restocking back. Lane errors do not: pressing
              explains them. */}
              {actionButton}
            </div>
          </div>

          <div className="grid min-h-0 grid-cols-1 grid-rows-[auto_minmax(22rem,1fr)] gap-4 overflow-y-auto lg:grid-cols-[250px_minmax(0,1fr)] lg:grid-rows-1 lg:overflow-visible xl:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="grid grid-rows-[auto_minmax(0,16rem)] gap-2 lg:min-h-0 lg:grid-rows-[auto_minmax(0,1fr)]">
              <div className="grid gap-2">
                {removalSkuId ? (
                  <>
                    <PanelTitle size="sm" title={t("skuRemovalTitle")} />
                    <SkuRemovalPanel
                      canRemoveAll={FEATURES.canRemoveAllSpecificDrink}
                      count={removalCount}
                      removalBlock={removalBlock}
                      removing={removingSku}
                      sku={skuById.get(removalSkuId)}
                      skuId={removalSkuId}
                      onCancel={() => setSkuRemoval(null)}
                      onRemoveAll={() => {
                        setRemovingSku(true)
                        // Done or not, the lookup ends.
                        void onRemoveSku(removalSkuId).finally(() => {
                          setRemovingSku(false)
                          setSkuRemoval(null)
                        })
                      }}
                    />
                  </>
                ) : (
                  <>
                    {shownGuide && (
                      <RestockGuideCard guide={shownGuide} skuById={skuById} />
                    )}
                    <PanelTitle size="sm" title={t("scannedDrinkTitle")} />
                    <ScannedDrinkCard
                      currentCount={scannedCurrentCount}
                      row={recommendationRows.find(
                        (row) => row.skuId === scannedSkuId
                      )}
                      sku={skuById.get(scannedSkuId)}
                      skuId={scannedSkuId}
                    />
                  </>
                )}
                <PanelTitle size="sm" title={t("recommendationListTitle")} />
                {showAgedNotice && (
                  <p className="mt-1 rounded-sm bg-warning-subtle p-2 text-xs font-bold text-primary">
                    {t("agedStockNotice", {
                      days: agedStockRule.thresholdDays,
                    })}
                  </p>
                )}
              </div>

              <RecommendationTable
                highlightedSkuId={scannedSkuId}
                label={t("recommendationListTitle")}
                loading={recommendationsLoading}
                readFailed={recommendationsReadFailed}
                reloading={busyAction === "load-recommendations"}
                rows={recommendationRows}
                onReload={onReloadRecommendations}
              />
            </aside>

            <div className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-2">
              <div className="flex min-w-0 items-center justify-between gap-3">
                <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
                  <PanelTitle size="sm" title={t("common:shelf.stock")} />
                  <span className="text-xs font-bold text-secondary">
                    {t("stockTotalDrinks", { count: totalDrinks })}
                  </span>
                  {notOnDisplayDrinks > 0 && (
                    <span className="rounded-sm bg-warning-subtle px-2 text-xs font-bold text-primary">
                      {t("stockDrinksNotOnDisplay", {
                        count: notOnDisplayDrinks,
                      })}
                    </span>
                  )}
                </div>
                <LaneLegend present={presentLaneStates} />
              </div>
              <section className="min-h-0 min-w-0 overflow-hidden rounded-lg bg-subtle p-2">
                <ShelfGrid
                  cabinet={cabinet}
                  kind="stock"
                  layout="fill"
                  renderCell={(cell, row) => (
                    <StockLane
                      addedCount={laneAddedCounts.get(cell.id)}
                      aged={agedLaneIds.has(cell.id)}
                      cell={cell}
                      columnLabel={getColumnLabel(cell, row, "stock")}
                      guideRole={getGuideRole(cell.id, row.row)}
                      lastAdded={cell.id === lastAddedLaneId}
                      misplaced={shownMisplacedLaneIds.has(cell.id)}
                      restockingPlacement={boardPlacement}
                      selected={cell.id === selectedId}
                      selectedCellScrollSignal={selectedCellScrollSignal}
                      skuById={skuById}
                      toRemoveCount={
                        cell.location
                          ? countLaneSku(cell.location, removalSkuId)
                          : 0
                      }
                      onSelect={() => onOpenLane(cell.id)}
                    />
                  )}
                />
              </section>
            </div>
          </div>
        </>
      )}

      <LaneDetailDrawer
        agedStockRule={agedStockRule}
        cell={detailCell}
        checkingLane={busyAction === "check-lane"}
        columnLabel={detailColumnLabel}
        errorLaneCount={errorLaneIds.length}
        heading={detailHeading}
        isMisplacedSku={restocking ? isNeverMisplaced : isMisplacedSku}
        now={now}
        removal={{
          block: removalBlock,
          marks: laneMarks,
          removing: busyAction === "remove-drink",
          switchPromptOpen: laneSwitchPromptOpen,
          onCancelSwitch: onCancelLaneSwitch,
          onFinish: onFinishLaneRemoval,
          onMarksChange: onLaneMarksChange,
          onRequestClose: onRequestCloseLane,
        }}
        skuById={skuById}
        onCheckLaneMatched={onCheckLaneMatched}
        onClose={onCloseLane}
      />

      <ProductSearchDialog
        open={Boolean(skuRemoval?.picking) || findPicking}
        search={pickerSearch}
        skus={allSkus}
        onCancel={() => {
          setSkuRemoval(null)
          setFindPicking(false)
          setPickerSearch("")
        }}
        onSearchChange={setPickerSearch}
        onSelect={(skuId) => {
          setPickerSearch("")
          if (findPicking) {
            setFindPicking(false)
            setFoundSkuId(skuId)
            return
          }
          if (countSkuStock(skuId) === 0) {
            setSkuRemoval(null)
            setNoStockOpen(true)
            return
          }
          setSkuRemoval({ picking: false, skuId })
        }}
      />

      <MessageDialog
        message={t("skuRemovalNoStock")}
        okLabel={t("common:actions.ok")}
        open={noStockOpen}
        onClose={() => setNoStockOpen(false)}
      />
    </section>
  )
}
