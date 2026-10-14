import { Power, QrCode, ScanBarcode } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "~/core"
import { cn } from "~/utils/cn"

/** Header left: scanner state, the scanner-recovery QR button and the robot popup button. */
export function AppHeaderScannerStatus({
  scannerConnected,
  onOpenScannerRecovery,
  onOpenRobotPower,
}: {
  scannerConnected: boolean
  onOpenScannerRecovery: () => void
  onOpenRobotPower: () => void
}) {
  const { t } = useTranslation("app")

  return (
    <div className="flex min-w-0 items-center gap-2">
      <span
        className={cn(
          "inline-flex min-w-0 items-center gap-1.5 text-sm font-bold sm:text-base",
          scannerConnected ? "text-primary" : "text-error"
        )}
      >
        <ScanBarcode
          className={cn(
            "size-5 shrink-0",
            scannerConnected ? "text-success" : "text-error"
          )}
        />
        <span className="truncate">
          {scannerConnected ? t("scannerConnected") : t("scannerDisconnected")}
        </span>
      </span>
      <Button
        variant="unstyled"
        size="unstyled"
        aria-label={t("scannerRecoveryOpen")}
        className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary text-on-primary transition active:bg-primary-pressed [&_svg]:size-6"
        type="button"
        onClick={onOpenScannerRecovery}
      >
        <QrCode />
      </Button>
      <Button
        variant="unstyled"
        size="unstyled"
        aria-label={t("workflow.robotPower.open")}
        className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary text-on-primary transition active:bg-primary-pressed [&_svg]:size-6"
        type="button"
        onClick={onOpenRobotPower}
      >
        <Power strokeWidth={2.5} />
      </Button>
    </div>
  )
}
