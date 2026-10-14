import { useTranslation } from "react-i18next"

import { MessageDialog } from "~/components/dialog/message-dialog"
import { OPERATIONS_CENTER_PHONE } from "~/config/app"
import { withSupportCodes } from "~/domains/operations"
import { readRestockingState, useCurrentScanAlert } from "~/domains/restocking"
import { useSkuById } from "~/domains/shelf"
import { getLocalizedSkuName } from "~/model/sku"

/** Message per OPM refusal; anything else reads as an unknown failure. */
const REFUSAL_MESSAGE_KEYS = {
  NoRestockTask: "scanRefusedNoRestockTask",
  ServerError: "scanRefusedServerError",
  ShelfClientTimeout: "scanRefusedShelfClientTimeout",
  ShelvesError: "scanRefusedShelvesError",
  SkuDoesNotExist: "scanRefusedSkuDoesNotExist",
  StockHasErrors: "scanRefusedStockHasErrors",
  WeightStabilizationTimeout: "scanRefusedWeightStabilizationTimeout",
} as const

function getRefusalMessageKey(error: string) {
  return Object.hasOwn(REFUSAL_MESSAGE_KEYS, error)
    ? REFUSAL_MESSAGE_KEYS[error as keyof typeof REFUSAL_MESSAGE_KEYS]
    : "scanRefusedUnknown"
}

/** One alert at a time; later scans queue behind it. */
export function ScanAlertDialog({ blocked }: { blocked: boolean }) {
  const { i18n, t } = useTranslation(["app", "common"])
  const alert = useCurrentScanAlert()
  const skuById = useSkuById()

  function getMessage(): string {
    switch (alert?.kind) {
      case undefined:
        return ""
      case "not-in-system":
        return t("scanAlertNotInSystem", {
          code: alert.code,
          phone: OPERATIONS_CENTER_PHONE,
        })
      case "not-on-display":
        return t("scanAlertNotOnDisplay", {
          name:
            getLocalizedSkuName(skuById.get(alert.skuId), i18n.language) ||
            alert.skuId,
        })
      case "same-jan":
        return t("scanAlertSameJan")
      case "lane-errors":
        return t("scanAlertLaneErrors")
      case "no-scanned-drink":
        return t("scanAlertNoScannedDrink")
      case "invalid-scan":
        return t("scanAlertInvalidScan")
      case "disconnected":
        return t("scanAlertDisconnected")
      case "refused":
        return withSupportCodes(
          t(getRefusalMessageKey(alert.error)),
          alert.code ? [alert.code] : []
        )
    }
  }

  // OPM refusals and a dropped call read "Close"; the rest read "OK".
  const closes = alert?.kind === "refused" || alert?.kind === "disconnected"

  return (
    <MessageDialog
      message={getMessage()}
      okLabel={t(closes ? "common:actions.close" : "common:actions.ok")}
      open={Boolean(alert) && !blocked}
      onClose={() => readRestockingState().dismissScanAlert()}
    />
  )
}
