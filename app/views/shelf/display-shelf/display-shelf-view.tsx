import { useMemo, useState } from "react"

import { ArrowLeftRight, CalendarDays, Check } from "lucide-react"
import { useTranslation } from "react-i18next"

import type {
  DisplayManualJob,
  ShelfLocationHistory,
  ShelfSpec,
  Sku,
} from "~/api/opm/schemas"
import { PanelTitle } from "~/components/layout/panel-title"
import { CabinetTabs } from "~/components/shelf/cabinet-tabs"
import { useActiveCabinet } from "~/components/shelf/use-active-cabinet"
import { Button, Select } from "~/core"
import {
  countLocations,
  createDiffCellIds,
  findCell,
  getLocationSkuId,
  groupDisplayShelfLocations,
  isCabinetBlocked,
  isDisplayCellSelected,
  isLaneSkuUnknown,
  type LayoutCabinet,
  type LayoutCell,
  type SelectedCell,
  type ShelfLocation,
} from "~/model/shelf"
import { isCutProduct } from "~/model/sku"
import type { BusyAction } from "~/types/busy-action"
import { formatDate } from "~/utils/date"

import { DisplayCabinetPanel } from "./components/display-cabinet-panel"
import { ProductDetailDialog } from "./components/product-detail-dialog"
import { ReservationList } from "./components/reservation-list"
import { SelectedLaneCard } from "./components/selected-lane-card"

/** The history option that shows the open layout change's starting layout. */
const TEMPORARY_HISTORY = "temporary"

export function DisplayShelfView({
  board: currentBoard,
  busyAction,
  histories,
  manualJobs,
  selectedCell,
  skuById,
  spec,
  temporaryLocations,
  onReserveLane,
  onSelect,
  onUnknownSku,
}: {
  board: LayoutCabinet[]
  busyAction: BusyAction
  histories: ShelfLocationHistory[]
  manualJobs: DisplayManualJob[] | null
  selectedCell: SelectedCell
  skuById: Map<string, Sku>
  spec: ShelfSpec | null
  /** The open layout change's starting lanes; empty hides the temporary entry. */
  temporaryLocations: ShelfLocation[]
  onReserveLane: (locationId: string) => void
  onSelect: (cell: SelectedCell) => void
  /** A lane whose SKU is not in the catalogue was tapped; it is not selected. */
  onUnknownSku: () => void
}) {
  const { i18n, t } = useTranslation(["app", "common"])

  const [pickedHistory, setPickedHistory] = useState("")
  const [detailCell, setDetailCell] = useState<LayoutCell | null>(null)

  const hasTemporary = temporaryLocations.length > 0
  // The entry goes when the layout change closes, taking the operator back to the current layout.
  const historyTimestamp =
    pickedHistory === TEMPORARY_HISTORY && !hasTemporary ? "" : pickedHistory
  const showTemporary = historyTimestamp === TEMPORARY_HISTORY
  const temporaryBoard = useMemo(
    () => groupDisplayShelfLocations(temporaryLocations, spec),
    [temporaryLocations, spec]
  )
  // Tabs, count, disabled state and selection all follow the layout on show.
  const board = showTemporary ? temporaryBoard : currentBoard
  const [currentCabinet, setCabinet] = useActiveCabinet(board)

  const historyBoards = useMemo(
    () =>
      histories.map((history) => ({
        ...history,
        board: groupDisplayShelfLocations(history.locations, spec),
      })),
    [histories, spec]
  )
  const selectedHistory = historyBoards.find(
    (history) => String(history.timestamp) === historyTimestamp
  )
  const selectedHistoryCabinet = selectedHistory?.board.find(
    (item) => item.cabinet === currentCabinet?.cabinet
  )
  const compareMode = Boolean(selectedHistory)
  const historyOptions = [
    ...(hasTemporary
      ? [{ label: t("displayTemporaryLayout"), value: TEMPORARY_HISTORY }]
      : []),
    { label: "--", value: "" },
    ...historyBoards.map((history) => ({
      label: formatDate(history.timestamp, "dateTime", i18n.language),
      value: String(history.timestamp),
    })),
  ]
  const disabledCabinets = useMemo(
    () =>
      new Set(board.filter(isCabinetBlocked).map((cabinet) => cabinet.cabinet)),
    [board]
  )
  const currentCabinetDisabled = isCabinetBlocked(currentCabinet)
  const diffCellIds = useMemo(() => {
    if (!selectedHistoryCabinet || !currentCabinet) {
      return new Set<string>()
    }
    return createDiffCellIds(currentCabinet, selectedHistoryCabinet)
  }, [currentCabinet, selectedHistoryCabinet])

  const selectedLayoutCell =
    selectedCell?.kind === "display" ? findCell(board, selectedCell.id) : null
  const selectedLocation = selectedLayoutCell?.location
  const selectedSkuId = selectedLocation
    ? getLocationSkuId(selectedLocation)
    : ""
  const selectedSku = selectedSkuId ? skuById.get(selectedSkuId) : undefined
  const selectedCutProduct = isCutProduct(selectedSku)
  const selectedLocationId = selectedLocation?.id ?? ""
  const reserving = busyAction === `display-manual-job:${selectedLocationId}`

  const detailSku = detailCell?.location
    ? skuById.get(getLocationSkuId(detailCell.location))
    : undefined

  // A second tap on the selected lane deselects it.
  function tapCell(cell: LayoutCell) {
    if (isLaneSkuUnknown(cell, skuById)) {
      onUnknownSku()
      return
    }
    // Comparing hides the side panel, so a tap shows the product instead.
    if (compareMode) {
      openDetail(cell)
      return
    }
    onSelect(
      isDisplayCellSelected(selectedCell, cell)
        ? null
        : { kind: "display", id: cell.id }
    )
  }

  // A double tap's two clicks toggle the lane twice, so select it outright.
  function openDetail(cell: LayoutCell) {
    if (isLaneSkuUnknown(cell, skuById)) {
      return
    }
    onSelect({ kind: "display", id: cell.id })
    setDetailCell(cell)
  }

  function changeCabinet(cabinet: number) {
    setCabinet(cabinet)
    onSelect(null)
  }

  function changeHistory(timestamp: string) {
    setPickedHistory(timestamp)
    // Swapping the layout shown starts again from cabinet 1.
    const swapsLayout = showTemporary !== (timestamp === TEMPORARY_HISTORY)
    if (swapsLayout) {
      setCabinet(null)
    }
    if (timestamp || swapsLayout) {
      onSelect(null)
    }
  }

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="mb-4 flex min-w-0 shrink-0 flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <div className="min-w-0">
            <PanelTitle title={t("displayShelfView")} />
            <p className="mt-1 text-sm font-bold text-secondary">
              {currentCabinet ? countLocations([currentCabinet]) : 0}{" "}
              {t("displayFaceCount")}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
          <label className="flex h-11 min-w-55 items-center gap-2 rounded-md border border-strong bg-default px-3 text-xs font-bold">
            <CalendarDays className="size-5 shrink-0" />
            <span className="sr-only">{t("displayLayoutHistory")}</span>
            <Select.Root
              className="min-w-0 flex-1 font-bold"
              options={historyOptions}
              value={historyTimestamp}
              onValueChange={changeHistory}
            />
          </label>

          {hasTemporary && !compareMode && (
            <Button
              aria-pressed={showTemporary}
              type="button"
              onClick={() =>
                changeHistory(showTemporary ? "" : TEMPORARY_HISTORY)
              }
              variant="secondary"
              size="sm"
            >
              {showTemporary && <Check />}
              {t("displayTemporaryLayout")}
            </Button>
          )}

          {compareMode && (
            <Button
              type="button"
              onClick={() => setPickedHistory("")}
              variant="secondary"
              size="sm"
            >
              <ArrowLeftRight />
              {t("removeComparing")}
            </Button>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-lg border bg-default p-3">
        <div className="mb-3 flex shrink-0 flex-wrap gap-2">
          <CabinetTabs
            board={board}
            disabledCabinets={disabledCabinets}
            kind="display"
            value={currentCabinet?.cabinet}
            onChange={changeCabinet}
          />
        </div>

        {compareMode ? (
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden xl:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)]">
            <DisplayCabinetPanel
              cabinet={selectedHistoryCabinet}
              label={formatDate(
                Number(historyTimestamp),
                "dateTime",
                i18n.language
              )}
              selectedCell={null}
              skuById={skuById}
            />
            <div className="hidden bg-muted xl:block" />
            <DisplayCabinetPanel
              cabinet={currentCabinet}
              diffCellIds={diffCellIds}
              disabled={currentCabinetDisabled}
              hint={t("currentShelfFrontView")}
              label={t("currentShelf")}
              selectedCell={selectedCell}
              skuById={skuById}
              onCellClick={tapCell}
              onCellDetail={openDetail}
            />
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden xl:grid-cols-[minmax(0,1fr)_360px]">
            <DisplayCabinetPanel
              cabinet={currentCabinet}
              disabled={currentCabinetDisabled}
              hint={t("currentShelfFrontView")}
              label={t("currentShelf")}
              selectedCell={selectedCell}
              skuById={skuById}
              onCellClick={tapCell}
              onCellDetail={openDetail}
            />

            <aside className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3">
              <section className="rounded-lg bg-subtle p-3">
                <SelectedLaneCard
                  cutProduct={selectedCutProduct}
                  cell={selectedLayoutCell}
                  reserving={reserving}
                  sku={selectedSku}
                  onOpenDetail={setDetailCell}
                  onReserve={() => {
                    if (selectedLocationId) {
                      onReserveLane(selectedLocationId)
                    }
                  }}
                />
              </section>

              <ReservationList
                board={currentBoard}
                jobs={manualJobs}
                skuById={skuById}
              />
            </aside>
          </div>
        )}
      </div>

      <ProductDetailDialog
        cell={detailCell}
        sku={detailSku}
        onClose={() => setDetailCell(null)}
      />
    </section>
  )
}
