import { useTranslation } from "react-i18next"

import type { Sku } from "~/api/opm/schemas"
import { Button } from "~/core"
import { getSkuVolume } from "~/model/sku"
import { cn } from "~/utils/cn"

import { ProductThumb } from "../product/product-thumb"

/**
 * The lane every shelf board draws: lane number, drink photo and volume.
 * Callers add their colours through `className` and badges or overlays as
 * `children`; size comes from the board or `className`.
 */
export function LaneCard({
  children,
  className,
  columnLabel,
  flashSignal = 0,
  sku,
  skuId,
  ...props
}: LaneCard.Props) {
  const { t } = useTranslation("common")
  const volume = getSkuVolume(sku) || (skuId ? t("shelf.skuFallback") : "")

  return (
    <Button
      variant="unstyled"
      size="unstyled"
      className={cn(
        "relative flex min-h-0 min-w-0 flex-col rounded-md border-2 bg-default p-1 text-center transition",
        className
      )}
      type="button"
      {...props}
    >
      {flashSignal > 0 && (
        <span
          key={flashSignal}
          aria-hidden
          className="lane-flash pointer-events-none absolute inset-0 rounded-md bg-success/45 opacity-0 ring-4 ring-success"
        />
      )}
      <span className="mb-1 h-4 w-full shrink-0 rounded-full bg-muted text-xs/4 font-normal">
        {columnLabel}
      </span>
      <span className="flex min-h-0 w-full flex-1 items-end justify-center">
        {skuId && (
          <ProductThumb
            className="h-full max-h-28 w-16 max-w-full"
            markCut
            sku={sku}
          />
        )}
      </span>
      {volume && (
        <span className="mt-0.5 w-full shrink-0 truncate text-xs/4 font-bold text-secondary">
          {volume}
        </span>
      )}
      {children}
    </Button>
  )
}

export declare namespace LaneCard {
  type Props = Omit<Button.Props, "variant" | "size"> & {
    columnLabel: number
    /** Replays the green flash whenever it changes; 0 never flashes. */
    flashSignal?: number
    sku?: Sku
    skuId: string
  }
}
