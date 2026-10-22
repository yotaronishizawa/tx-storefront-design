import { Power, QrCode, ScanBarcode } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "~/core"
import { cn } from "~/utils/cn"

/**
 * The scanner's battery, once the scanner reports it (no source yet: OPM and
 * the stock-shelf hub carry no battery value, so only `undefined` is used).
 */
export type ScannerBattery = "ok" | "low" | "critical" | "unknown"

/**
 * Header left: the scanner group, then the robot popup button.
 * The scanner state and its recovery button share one grey group, so
 * "反応しない時" needs no subject: the group says it is the scanner.
 * Disconnected, the button is "?" and opens what to check instead.
 */
export function AppHeaderScannerStatus({
  scannerConnected,
  battery,
  onOpenScannerRecovery,
  onOpenScannerHelp,
  onOpenRobotPower,
}: {
  scannerConnected: boolean
  battery?: ScannerBattery
  onOpenScannerRecovery: () => void
  onOpenScannerHelp: () => void
  onOpenRobotPower: () => void
}) {
  const { t } = useTranslation("app")
  const label = !scannerConnected
    ? t("scannerDisconnected")
    : battery === "low"
      ? t("scannerBatteryLow")
      : battery === "critical"
        ? t("scannerBatteryCritical")
        : battery === "unknown"
          ? t("scannerBatteryUnknown")
          : t("scannerConnected")
  const pill = scannerConnected && (battery === "low" || battery === "critical")

  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="flex shrink-0 items-center gap-1 rounded-full bg-muted p-1">
        <span
          className={cn(
            "inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm whitespace-nowrap",
            !scannerConnected && "text-secondary",
            battery === "low" &&
              scannerConnected &&
              "border border-warning bg-warning-subtle text-primary",
            battery === "critical" &&
              scannerConnected &&
              "bg-error text-inverse"
          )}
        >
          <ScanBarcode
            aria-hidden="true"
            className={cn(
              "size-5 shrink-0",
              !scannerConnected
                ? "text-secondary"
                : pill
                  ? "text-current"
                  : "text-success"
            )}
          />
          <span>{label}</span>
        </span>
        {scannerConnected ? (
          <Button
            variant="unstyled"
            size="unstyled"
            className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 text-sm font-bold text-on-primary transition active:bg-primary-pressed"
            type="button"
            onClick={onOpenScannerRecovery}
          >
            <QrCode aria-hidden="true" className="size-5" />
            {t("scannerRecoveryWhen")}
          </Button>
        ) : (
          <Button
            variant="unstyled"
            size="unstyled"
            aria-label={t("scannerHelpOpen")}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-on-primary transition active:bg-primary-pressed"
            type="button"
            onClick={onOpenScannerHelp}
          >
            <span aria-hidden="true" className="text-xl font-bold">
              ?
            </span>
          </Button>
        )}
      </div>
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
