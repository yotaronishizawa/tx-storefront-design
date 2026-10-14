import type { ReactNode } from "react"

import {
  CircleHelp,
  Clock,
  RotateCcw,
  Trash2,
  TriangleAlert,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "~/core"
import type { LaneDrink } from "~/model/shelf"
import { getLocalizedSkuName, getSkuVolume } from "~/model/sku"
import { cn } from "~/utils/cn"
import { formatDate, getDaysSince } from "~/utils/date"

import { ProductThumb } from "../../product/product-thumb"
import { DaysOnShelf } from "./days-on-shelf"

export function LaneDrinkRow({
  aged,
  drink,
  marked,
  misplaced,
  now,
  removable,
  showDates,
  wrongLane,
  onToggleMark,
}: {
  aged: boolean
  drink: LaneDrink
  /** Marked for removal; it leaves the lane when the operator finishes. */
  marked: boolean
  misplaced: boolean
  now: Date
  removable: boolean
  /** Off when the store has no aged-stock rule. */
  showDates: boolean
  /** The lane's size constraint rejects this drink. */
  wrongLane: boolean
  /** Left out, the row has no remove button. */
  onToggleMark?: () => void
}) {
  const { i18n, t } = useTranslation(["app", "common"])
  const name = getLocalizedSkuName(drink.sku, i18n.language) || drink.skuId
  const days = getDaysSince(drink.addedAt, now)

  return (
    <li
      className={cn(
        "grid gap-2 rounded-lg border-2 border-default bg-default p-2",
        {
          "border-error bg-error-subtle": wrongLane && !marked,
          "border-warning bg-warning-subtle":
            misplaced && !wrongLane && !marked,
          "border-dashed border-strong bg-muted": marked,
        }
      )}
    >
      <div
        className={cn(
          "flex min-h-18 items-stretch gap-3",
          // The button stays at full strength: it is how the mark is undone.
          marked && "[&>:not(button)]:opacity-40"
        )}
      >
        <span className="grid w-7 shrink-0 place-items-center rounded-full bg-muted text-base font-bold">
          {drink.position}
        </span>
        <ProductThumb
          className="h-16 w-6 shrink-0 self-center"
          sku={drink.sku}
        />

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
          <span className="text-base/tight font-bold">
            {getSkuVolume(drink.sku)}
          </span>
          <span className="line-clamp-2 text-xs/snug font-medium text-secondary">
            {name}
          </span>
        </div>

        {showDates && (
          <>
            <span aria-hidden className="my-1 w-px shrink-0 bg-muted" />
            <div className="flex min-w-40 shrink-0 flex-col items-end justify-center gap-1 text-right">
              {days === null ? (
                <RowChip
                  className="bg-muted text-secondary"
                  icon={<CircleHelp />}
                >
                  {t("laneDrinkAddedAtUnknown")}
                </RowChip>
              ) : (
                <>
                  {aged && (
                    <RowChip
                      className="bg-warning text-inverse"
                      icon={<Clock />}
                    >
                      {t("laneDrinkAged")}
                    </RowChip>
                  )}
                  <DaysOnShelf aged={aged} days={days} />
                  <span className="text-xs whitespace-nowrap text-secondary">
                    {t("laneDrinkAddedAtValue", {
                      date: formatDate(
                        drink.addedAt,
                        "dateTime",
                        i18n.language
                      ),
                    })}
                  </span>
                </>
              )}
            </div>
          </>
        )}

        {onToggleMark && (
          <Button
            aria-label={
              marked
                ? t("laneDrinkUnmark", { name })
                : t("laneDrinkRemove", { name })
            }
            aria-pressed={marked}
            className="h-auto w-16 flex-col gap-1 self-stretch px-2 text-xs"
            disabled={!removable}
            icon={marked ? <RotateCcw /> : <Trash2 />}
            size="md"
            type="button"
            variant="secondary"
            onClick={onToggleMark}
          >
            {marked ? t("laneDrinkUndo") : t("common:actions.remove")}
          </Button>
        )}
      </div>

      {/* Full width so the reason never wraps beside the volume. */}
      {marked && (
        <RowAlert className="bg-inverse text-inverse">
          {t("laneDrinkMarked")}
        </RowAlert>
      )}
      {wrongLane && !marked && (
        <RowAlert className="bg-error text-inverse">
          {t("laneDrinkWrongLane")}
        </RowAlert>
      )}
      {misplaced && !marked && (
        <RowAlert className="bg-warning text-inverse">
          {t("laneDrinkMisplaced")}
        </RowAlert>
      )}
    </li>
  )
}

function RowAlert({
  children,
  className,
}: {
  children: ReactNode
  className: string
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-1 text-xs font-bold",
        className
      )}
    >
      <TriangleAlert className="size-4 shrink-0" />
      {children}
    </p>
  )
}

function RowChip({
  children,
  className,
  icon,
}: {
  children: ReactNode
  className: string
  icon: ReactNode
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-full px-2 py-1 text-xs font-bold [&_svg]:size-4 [&_svg]:shrink-0",
        className
      )}
    >
      {icon}
      {children}
    </span>
  )
}
