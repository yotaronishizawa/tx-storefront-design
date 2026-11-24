import { useState } from "react"

import { CheckCheck, Info, RotateCcw, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { Sku, StockDrinkRemoval } from "~/api/opm/schemas"
import { Button, Drawer } from "~/core"
import type { StockRemovalBlock } from "~/model/robot-status"
import {
  getLaneDrinks,
  getLaneErrorSummary,
  isAgedDrink,
  keepCurrentRemovals,
  type AgedStockRule,
  type LaneDrink,
  type LaneMarks,
  type LayoutCell,
} from "~/model/shelf"
import { cn } from "~/utils/cn"

import { ConfirmDialog } from "../../dialog/confirm-dialog"
import { LaneDrinkRow } from "./lane-drink-row"
import { LaneErrorAlert } from "./lane-error-alert"
import { REMOVAL_BLOCK_MESSAGE_KEYS } from "./removal-block-message"

/** Drink removal from the drawer; the restocking board offers it, manual replenishment does not. */
type LaneRemovalControls = {
  block: StockRemovalBlock
  /** A tap only marks a drink; nothing reaches OPM until Finish. */
  marks: LaneMarks
  /** A removal is on its way to OPM. */
  removing: boolean
  /** The Finish/Cancel prompt for leaving a lane with drinks marked. */
  switchPromptOpen: boolean
  onCancelSwitch: () => void
  onFinish: (locationId: string, removals: StockDrinkRemoval[]) => void
  onMarksChange: (marks: LaneMarks) => void
  /** Closes, asking Finish or Cancel first when drinks are marked. */
  onRequestClose: () => void
}

const NO_REMOVAL: LaneRemovalControls = {
  block: "",
  marks: { locationId: "", removals: [] },
  removing: false,
  switchPromptOpen: false,
  onCancelSwitch: () => {},
  onFinish: () => {},
  onMarksChange: () => {},
  onRequestClose: () => {},
}

export function LaneDetailDrawer({
  agedStockRule,
  cell,
  checkingLane,
  columnLabel,
  errorLaneCount,
  heading,
  isMisplacedSku = isNeverMisplaced,
  matchConfirmMessage,
  now,
  removal,
  skuById,
  onCheckLaneMatched,
  onClose,
}: {
  agedStockRule?: AgedStockRule
  cell?: LayoutCell
  checkingLane: boolean
  columnLabel: number
  /** Red lanes on the whole board, for the "N lanes with errors" heading. */
  errorLaneCount: number
  /**
   * Names the lane in place of its cabinet-row-lane numbers, e.g. the restock
   * study's "左の棚、緑茶の右どなり", which staff can find on the real shelf.
   */
  heading?: string
  isMisplacedSku?: (skuId: string) => boolean
  /** The question before "Already matches"; each screen words it its own way. */
  matchConfirmMessage?: string
  now: Date
  /** Left out, the drawer only lists the drinks. */
  removal?: LaneRemovalControls
  skuById: Map<string, Sku>
  onCheckLaneMatched: (locationId: string) => Promise<boolean>
  /** Closes without asking; any marks are dropped. */
  onClose: () => void
}) {
  const { t } = useTranslation(["app", "common"])
  const [pendingCheckLocationId, setPendingCheckLocationId] = useState("")
  const {
    block: removalBlock,
    marks,
    removing,
    switchPromptOpen,
    onCancelSwitch,
    onFinish: onFinishRemoval,
    onMarksChange,
    onRequestClose,
  } = removal ?? NO_REMOVAL

  const drinks = cell ? getLaneDrinks(cell, skuById) : []
  const laneError = getLaneErrorSummary(cell?.location)
  const locationId = cell?.location?.id ?? ""
  const marked =
    marks.locationId === locationId
      ? keepCurrentRemovals(marks.removals, drinks)
      : []
  const canRemove = Boolean(removal) && !removalBlock && !removing
  // The question goes away once the lane fixes itself or the drawer closes.
  const checkPending =
    Boolean(pendingCheckLocationId) &&
    pendingCheckLocationId === locationId &&
    laneError.kind !== ""
  const unmarkedCount = drinks.length - marked.length

  function isMarked(drink: LaneDrink) {
    return marked.some((mark) => mark.skuIndex === drink.skuIndex)
  }

  function toggleMark(drink: LaneDrink) {
    onMarksChange({
      locationId,
      removals: isMarked(drink)
        ? marked.filter((mark) => mark.skuIndex !== drink.skuIndex)
        : [...marked, { skuId: drink.skuId, skuIndex: drink.skuIndex }],
    })
  }

  function confirmLaneMatched() {
    void onCheckLaneMatched(pendingCheckLocationId)
    setPendingCheckLocationId("")
  }

  function dismiss() {
    // Marks made before the shelf became blocked could not be sent anyway.
    if (marked.length > 0 && !removalBlock) {
      onRequestClose()
      return
    }
    onClose()
  }

  const secondaryActions = [
    removal && unmarkedCount > 0 && (
      <Button
        key="clear"
        disabled={!canRemove}
        icon={<Trash2 />}
        size="md"
        type="button"
        variant="secondary"
        onClick={() =>
          onMarksChange({
            locationId,
            removals: drinks.map(({ skuId, skuIndex }) => ({
              skuId,
              skuIndex,
            })),
          })
        }
      >
        {t("laneClear")}
      </Button>
    ),
    marked.length > 0 && (
      <Button
        key="reset"
        disabled={removing}
        icon={<RotateCcw />}
        size="md"
        type="button"
        variant="secondary"
        onClick={() => onMarksChange({ locationId: "", removals: [] })}
      >
        {t("laneRemovalReset")}
      </Button>
    ),
    laneError.kind && (
      <Button
        key="matches"
        busy={checkingLane}
        disabled={!locationId}
        icon={<CheckCheck />}
        size="md"
        type="button"
        onClick={() => setPendingCheckLocationId(locationId)}
      >
        {t("laneAlreadyMatches")}
      </Button>
    ),
  ].filter(Boolean)

  return (
    <>
      <Drawer.Root
        className="flex w-[min(540px,92vw)] flex-col bg-default p-5"
        open={Boolean(cell)}
        onDismiss={dismiss}
      >
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Drawer.Title render={<h3 />}>
              {heading ??
                (cell ? `${cell.cabinet}-${cell.row}-${columnLabel}` : "")}
            </Drawer.Title>
            {cell && !heading && (
              <p className="mt-1 pl-4 text-xs text-secondary">
                {t("laneDrinksTitle", {
                  cabinet: cell.cabinet,
                  lane: columnLabel,
                  row: cell.row,
                })}
              </p>
            )}
          </div>
          <Drawer.Close aria-label={t("common:actions.close")} />
        </header>

        {laneError.kind && (
          <LaneErrorAlert errorLaneCount={errorLaneCount} summary={laneError} />
        )}

        {removalBlock && (
          // Inline, not a tooltip: there is no hover on a touch tablet.
          <p
            className="mt-3 flex items-center gap-2 rounded-lg border-2 border-warning bg-warning-subtle px-3 py-2 text-xs font-bold text-primary"
            role="status"
          >
            <Info className="size-4 shrink-0" />
            {t(REMOVAL_BLOCK_MESSAGE_KEYS[removalBlock])}
          </p>
        )}

        <div className="mt-4 min-h-0 flex-1 overflow-auto">
          {drinks.length > 0 ? (
            <ol className="grid gap-2">
              {drinks.map((drink) => (
                <LaneDrinkRow
                  key={`${drink.skuId}-${drink.position}`}
                  aged={isAgedDrink(drink.addedAt, agedStockRule, now)}
                  drink={drink}
                  marked={isMarked(drink)}
                  misplaced={isMisplacedSku(drink.skuId)}
                  wrongLane={laneError.wrongSkuIds.has(drink.skuId)}
                  now={now}
                  removable={canRemove}
                  showDates={agedStockRule !== undefined}
                  onToggleMark={removal ? () => toggleMark(drink) : undefined}
                />
              ))}
            </ol>
          ) : (
            <p className="grid min-h-40 place-items-center rounded-lg bg-subtle text-center text-sm font-bold text-secondary">
              {t("common:selection.none", {
                entity: t("common:entity.product", { count: 1 }),
              })}
            </p>
          )}
        </div>

        {(secondaryActions.length > 0 || marked.length > 0) && (
          <footer className="mt-4 grid gap-3">
            {secondaryActions.length > 0 && (
              <div
                className={cn(
                  "grid gap-3",
                  secondaryActions.length > 1 && "grid-cols-2"
                )}
              >
                {secondaryActions}
              </div>
            )}
            {marked.length > 0 && (
              <Button
                busy={removing}
                disabled={!canRemove}
                icon={<Trash2 />}
                size="md"
                type="button"
                onClick={onRequestClose}
              >
                {t("laneRemovalFinish", { count: marked.length })}
              </Button>
            )}
          </footer>
        )}
      </Drawer.Root>

      {/* Cancel drops the marks and keeps the lane open. */}
      <ConfirmDialog
        cancelLabel={t("common:actions.cancel")}
        confirmLabel={t("laneRemovalFinishAction")}
        message={t("laneRemovalFinishConfirm")}
        open={switchPromptOpen}
        onCancel={onCancelSwitch}
        onConfirm={() => onFinishRemoval(locationId, marked)}
      />

      <ConfirmDialog
        cancelLabel={t("common:actions.cancel")}
        confirmLabel={t("laneAlreadyMatches")}
        message={matchConfirmMessage ?? t("laneAlreadyMatchesConfirm")}
        open={checkPending}
        onCancel={() => setPendingCheckLocationId("")}
        onConfirm={confirmLaneMatched}
      />
    </>
  )
}

function isNeverMisplaced() {
  return false
}
