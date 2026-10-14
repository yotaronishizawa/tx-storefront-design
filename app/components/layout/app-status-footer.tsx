import {
  Battery,
  Clock3,
  MapPin,
  QrCode,
  WifiSync,
  Zap,
  type LucideIcon,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "~/core"
import { useBatteryLevel } from "~/hooks/use-battery-level"
import { useCurrentTime } from "~/hooks/use-current-time"
import type { ScannerConnectionSource } from "~/model/scanner-scan"
import { cn } from "~/utils/cn"
import { formatDate } from "~/utils/date"

const SCANNER_SOURCE_BADGE: Record<
  NonNullable<ScannerConnectionSource>,
  {
    icon: LucideIcon
    labelKey: "scannerConnectedSignalR" | "scannerConnectedOpm"
  }
> = {
  signalr: { icon: Zap, labelKey: "scannerConnectedSignalR" },
  opm: { icon: WifiSync, labelKey: "scannerConnectedOpm" },
}

/** Reads the clock and battery itself, so their ticks re-render only the footer. */
export function AppStatusFooter({
  isRestockingInProgress = false,
  scannerConnected,
  scannerConnectionSource,
  storeName,
  onOpenScannerRecovery,
}: {
  isRestockingInProgress?: boolean
  scannerConnected: boolean
  scannerConnectionSource: ScannerConnectionSource
  storeName?: string
  onOpenScannerRecovery: () => void
}) {
  const { i18n, t } = useTranslation(["app", "common"])
  const now = useCurrentTime()
  const batteryLevel = useBatteryLevel()

  const timeText = formatDate(now, "clock", i18n.language)
  const sourceBadge = scannerConnectionSource
    ? SCANNER_SOURCE_BADGE[scannerConnectionSource]
    : null

  return (
    <footer className="flex h-10 shrink-0 items-center justify-between gap-4 px-6 text-xs font-bold text-secondary">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          variant="unstyled"
          size="unstyled"
          aria-label={t("scannerRecoveryOpen")}
          className="grid size-8 shrink-0 place-items-center rounded-md border bg-default text-primary transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none active:bg-muted [&_svg]:size-5"
          type="button"
          onClick={onOpenScannerRecovery}
        >
          <QrCode />
        </Button>
        <span
          className={cn(
            "my-1 inline-flex h-8 min-w-0 items-center gap-2 rounded-md px-3 text-xs font-bold",
            scannerConnected
              ? "bg-success-subtle text-success"
              : "bg-error-subtle text-error"
          )}
        >
          <span
            className={cn(
              "size-2 shrink-0 rounded-full",
              scannerConnected ? "bg-success" : "bg-error"
            )}
          />
          {scannerConnected && sourceBadge && (
            <sourceBadge.icon
              aria-label={t(sourceBadge.labelKey)}
              className="size-4 shrink-0"
              role="img"
            />
          )}
          <span className="truncate">
            {scannerConnected
              ? t("scannerConnected")
              : t("scannerDisconnected")}
          </span>
        </span>
        {isRestockingInProgress && (
          <span className="my-1 inline-flex h-8 min-w-0 items-center gap-2 rounded-md bg-primary-subtle px-3 text-xs font-bold text-primary-text">
            <span className="size-2 shrink-0 rounded-full bg-primary" />
            <span className="truncate">{t("restockingInProgress")}</span>
          </span>
        )}
      </div>

      <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-4">
        {storeName && (
          <>
            <span className="inline-flex min-w-0 items-center gap-2">
              <MapPin className="size-4 shrink-0" />
              <span className="truncate">{storeName}</span>
            </span>
            <span className="text-secondary">|</span>
          </>
        )}
        <span className="inline-flex items-center gap-2 text-primary">
          <Clock3 className="size-4" />
          {timeText}
        </span>
        {batteryLevel !== null && (
          <>
            <span className="text-secondary">|</span>
            <span className="inline-flex items-center gap-2 text-primary">
              <Battery className="size-4" />
              {batteryLevel}%
            </span>
          </>
        )}
      </div>
    </footer>
  )
}
