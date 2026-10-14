import { useMemo } from "react"

import { Clock } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { RequestContext, Sku } from "~/api/opm/schemas"
import { PanelTitle } from "~/components/layout/panel-title"
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
import { useCurrentTime } from "~/hooks/use-current-time"
import { isRequestInProgress } from "~/model/request-state"
import {
  countMisplacedDrinks,
  findCell,
  findRow,
  getBoardCells,
  getColumnLabel,
  getLaneErrorSummary,
  isLocationBlocked,
  type AgedStockRule,
  type LayoutCabinet,
} from "~/model/shelf"
import type { BusyAction } from "~/types/busy-action"

import { ManualSessionControls } from "./components/manual-session-controls"
import { ManualSessionStatus } from "./components/manual-session-status"
import type { ShelfSelection } from "./utils/manual-lane-types"

/**
 * The stock shelf during manual replenishment. Red lanes open a read-only
 * drawer whose "Already matches" is the only way to clear an error, since OPM
 * will not finish while one remains.
 */
export function ManualReplenishmentView({
  robotArm,
  agedLaneIds,
  agedStockRule,
  board,
  busyAction,
  errorLaneIds,
  isMisplacedSku,
  laneDrawerId,
  manualReplenishmentAvailable,
  misplacedLaneIds,
  pulledLane,
  request,
  selection,
  skuById,
  onCheckLaneMatched,
  onCloseLane,
  onFinish,
  onOpenLane,
  onStart,
}: {
  /** "Move the robot up or down", beside the screen's other actions. */
  robotArm: RobotArmControlProps
  /** Lanes holding a drink past the aged-stock threshold. */
  agedLaneIds: ReadonlySet<string>
  agedStockRule?: AgedStockRule
  board: LayoutCabinet[]
  busyAction: BusyAction
  /** Red lanes, most urgent first. */
  errorLaneIds: string[]
  /** A drink with no display-shelf lane to go to. */
  isMisplacedSku: (skuId: string) => boolean
  laneDrawerId: string
  /** The store has a shelf client, without which OPM refuses to start. */
  manualReplenishmentAvailable: boolean
  /** Lanes holding a drink that is not on the display shelf. */
  misplacedLaneIds: ReadonlySet<string>
  pulledLane: { laneId: string; signal: number }
  request?: RequestContext
  selection: ShelfSelection
  skuById: Map<string, Sku>
  onCheckLaneMatched: (locationId: string) => Promise<boolean>
  onCloseLane: () => void
  onFinish: () => void
  onOpenLane: (laneId: string) => void
  onStart: () => void
}) {
  const { t } = useTranslation(["app", "common"])
  const now = useCurrentTime()
  const { selectedCell, selectedCellScrollSignal } = selection
  const selectedId = selectedCell?.kind === "stock" ? selectedCell.id : ""
  const [cabinet, setCabinet] = useActiveCabinet(
    board,
    findCell(board, selectedId)?.cabinet,
    selectedCellScrollSignal
  )
  const hasBlockedLane = getBoardCells(board).some(
    (cell) => cell.location && isLocationBlocked(cell.location)
  )
  const presentLaneStates = useMemo(
    () =>
      getPresentLaneStates(cabinet ? getBoardCells([cabinet]) : [], {
        agedLaneIds,
        misplacedLaneIds,
      }),
    [agedLaneIds, cabinet, misplacedLaneIds]
  )
  const cabinetSummaries = useMemo(
    () => summarizeCabinets(board, skuById, { misplacedLaneIds }),
    [board, misplacedLaneIds, skuById]
  )
  const notOnDisplayDrinks = useMemo(
    () =>
      countMisplacedDrinks(board, skuById, misplacedLaneIds, isMisplacedSku),
    [board, isMisplacedSku, misplacedLaneIds, skuById]
  )
  const urgentLane = findCell(board, errorLaneIds[0] ?? "")
  const detailCell = findCell(board, laneDrawerId)
  const detailRow = findRow(board, laneDrawerId)

  // The fix-it instruction shows only while the task runs; any lane error
  // hides the aged-stock notice.
  const showErrorAction =
    isRequestInProgress(request) && errorLaneIds.length > 0
  const showAgedNotice = agedLaneIds.size > 0 && errorLaneIds.length === 0

  return (
    <section className="grid min-h-0 min-w-0 flex-1 grid-rows-[auto_auto_auto_minmax(0,1fr)] gap-2">
      <div className="grid shrink-0 grid-cols-1 items-center gap-2 lg:grid-cols-[minmax(0,1fr)_auto]">
        <CabinetTabs
          board={board}
          kind="stock"
          summaries={cabinetSummaries}
          value={cabinet?.cabinet}
          onChange={setCabinet}
        />
        <div className="grid grid-cols-[auto_auto] gap-2">
          <RobotArmControl {...robotArm} />
          <ManualSessionControls
            available={manualReplenishmentAvailable}
            busyAction={busyAction}
            request={request}
            onFinish={onFinish}
            onStart={onStart}
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <PanelTitle size="sm" title={t("manualReplenishment")} />
          <ManualSessionStatus
            errorLaneCount={errorLaneIds.length}
            hasBlockedLane={hasBlockedLane}
          />
          {notOnDisplayDrinks > 0 && (
            <span className="rounded-sm bg-warning-subtle px-2 text-xs font-bold text-primary">
              {t("stockDrinksNotOnDisplay", { count: notOnDisplayDrinks })}
            </span>
          )}
        </div>
        <LaneLegend present={presentLaneStates} />
      </div>

      <div className="empty:hidden">
        {showErrorAction && (
          <p
            className="rounded-md border-2 border-error bg-error-subtle px-3 py-2 text-sm/snug font-bold whitespace-pre-line text-primary"
            role="alert"
          >
            {getLaneErrorSummary(urgentLane?.location).kind === "constraint"
              ? t("manualLaneConstraintAction")
              : t("manualLaneDiscrepancyAction", {
                  count: errorLaneIds.length,
                })}
          </p>
        )}
        {showAgedNotice && (
          <p className="flex items-center gap-2 rounded-md bg-warning-subtle px-3 py-1.5 text-sm font-bold text-primary">
            <Clock className="size-5 shrink-0 text-warning" />
            {t("agedStockNotice", { days: agedStockRule?.thresholdDays })}
          </p>
        )}
      </div>

      <section className="min-h-0 min-w-0 overflow-hidden rounded-lg bg-subtle p-2">
        <ShelfGrid
          cabinet={cabinet}
          kind="stock"
          layout="fill"
          renderCell={(cell, row) => (
            <StockLane
              aged={agedLaneIds.has(cell.id)}
              cell={cell}
              columnLabel={getColumnLabel(cell, row, "stock")}
              flashSignal={
                pulledLane.laneId === cell.id ? pulledLane.signal : 0
              }
              misplaced={misplacedLaneIds.has(cell.id)}
              selected={cell.id === selectedId}
              selectedCellScrollSignal={selectedCellScrollSignal}
              skuById={skuById}
              onSelect={() => onOpenLane(cell.id)}
            />
          )}
        />
      </section>

      <LaneDetailDrawer
        agedStockRule={agedStockRule}
        cell={detailCell}
        checkingLane={busyAction === "check-lane"}
        columnLabel={
          detailCell && detailRow
            ? getColumnLabel(detailCell, detailRow, "stock")
            : 0
        }
        errorLaneCount={errorLaneIds.length}
        isMisplacedSku={isMisplacedSku}
        matchConfirmMessage={t("manualLaneMatchConfirm")}
        now={now}
        skuById={skuById}
        onCheckLaneMatched={onCheckLaneMatched}
        onClose={onCloseLane}
      />
    </section>
  )
}
