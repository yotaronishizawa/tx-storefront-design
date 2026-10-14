import type { Sku } from "~/api/opm/schemas"
import { Toast } from "~/core"
import { readLanguage } from "~/initializer/i18n"
import { getLocalizedSkuName } from "~/model/sku"

import { ProductThumb } from "./product-thumb"

const SCANNED_DRINK_TOAST_DURATION_MS = 3200

/** The "you scanned this drink" toast. Kept here so the restocking domain needs no JSX. */
export function showScannedDrinkToast({
  code,
  id,
  message,
  sku,
  type = "success",
}: {
  code: string
  id?: string
  message: string
  sku?: Sku
  type?: "error" | "info" | "success"
}) {
  const skuName = getLocalizedSkuName(sku, readLanguage())

  Toast.notify[type](message, {
    description: (
      <div className="mt-2 flex max-w-65 items-center gap-3">
        <ProductThumb className="h-12 w-8 shrink-0 rounded-sm" sku={sku} />
        <span className="min-w-0">
          <span className="block truncate text-xs font-bold text-inverse">
            {skuName || code || "-"}
          </span>
          {code && (
            <span className="block truncate text-xs font-bold text-inverse/75">
              {code}
            </span>
          )}
        </span>
      </div>
    ),
    duration: SCANNED_DRINK_TOAST_DURATION_MS,
    key: id,
  })
}
