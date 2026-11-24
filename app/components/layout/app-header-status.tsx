import { QrCode, ScanBarcode } from "lucide-react"
import type { SVGProps } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "~/core"
import type { ScannerBattery } from "~/model/scanner-battery"
import { cn } from "~/utils/cn"

/** A handheld scanner reading: the scanner is connected (Yotaro 2026-11-09). */
function ScannerReading(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 40 40" fill="currentColor" {...props}>
      <path d="M10 34.9997C8.33333 34.9997 7.00694 34.3538 6.02083 33.0622C5.03472 31.7705 4.74999 30.333 5.16666 28.7497L8.16666 17.4163C7.24999 16.833 6.49305 16.0413 5.89583 15.0413C5.29861 14.0413 4.99999 12.9163 4.99999 11.6663C4.99999 9.83301 5.65277 8.26356 6.95833 6.95801C8.26388 5.65245 9.83333 4.99967 11.6667 4.99967H25C26.25 4.99967 27.1944 5.52745 27.8333 6.58301C28.4722 7.63856 28.5139 8.7219 27.9583 9.83301L24.625 16.4997C24.3194 17.0552 23.9097 17.4997 23.3958 17.833C22.8819 18.1663 22.3056 18.333 21.6667 18.333H18.2917L17.8333 19.9997H18.3333C18.8056 19.9997 19.2014 20.1594 19.5208 20.4788C19.8403 20.7983 20 21.1941 20 21.6663V24.9997C20 25.4719 19.8403 25.8677 19.5208 26.1872C19.2014 26.5066 18.8056 26.6663 18.3333 26.6663H16.0833L14.8333 31.333C14.5278 32.4163 13.9306 33.2983 13.0417 33.9788C12.1528 34.6594 11.1389 34.9997 10 34.9997ZM10 31.6663C10.3889 31.6663 10.7222 31.5552 11 31.333C11.2778 31.1108 11.4722 30.8191 11.5833 30.458L14.8333 18.333H11.375L8.37499 29.583C8.23611 30.1108 8.33333 30.59 8.66666 31.0205C9 31.4511 9.44444 31.6663 10 31.6663ZM11.6667 14.9997H21.6667L25 8.33301H11.6667C10.75 8.33301 9.96527 8.6594 9.3125 9.31217C8.65972 9.96495 8.33333 10.7497 8.33333 11.6663C8.33333 12.583 8.65972 13.3677 9.3125 14.0205C9.96527 14.6733 10.75 14.9997 11.6667 14.9997ZM31.6667 8.33301L30.625 6.08301L36.6667 3.33301L37.6667 5.62467L31.6667 8.33301ZM36.6667 19.9997L30.625 17.2913L31.6667 14.9997L37.6667 17.7497L36.6667 19.9997ZM31.6667 12.9163V10.4163H38.3333V12.9163H31.6667Z" />
    </svg>
  )
}

/**
 * Header left: the scanner group (the robot popup opens from "ロボット状態").
 * The scanner state and its recovery button share one grey group, so
 * "反応しない時" needs no subject: the group says it is the scanner.
 * Disconnected, the button is "?" and opens what to check instead.
 */
export function AppHeaderScannerStatus({
  scannerConnected,
  battery,
  onOpenScannerRecovery,
  onOpenScannerHelp,
}: {
  scannerConnected: boolean
  battery?: ScannerBattery
  onOpenScannerRecovery: () => void
  onOpenScannerHelp: () => void
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
      <div className="flex shrink-0 items-center gap-1 rounded-xl bg-subtle p-1">
        <span
          className={cn(
            "inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm whitespace-nowrap",
            !scannerConnected && "text-secondary",
            battery === "low" &&
              scannerConnected &&
              "border border-warning bg-warning-subtle text-primary",
            battery === "critical" &&
              scannerConnected &&
              "bg-error text-inverse"
          )}
        >
          {scannerConnected ? (
            <ScannerReading
              aria-hidden="true"
              className={cn(
                "size-5 shrink-0",
                pill ? "text-current" : "text-success"
              )}
            />
          ) : (
            <ScanBarcode
              aria-hidden="true"
              className="size-5 shrink-0 text-secondary"
            />
          )}
          <span>{label}</span>
        </span>
        {scannerConnected ? (
          <Button
            variant="unstyled"
            size="unstyled"
            className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 text-sm font-bold text-on-primary transition active:bg-primary-pressed"
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
            className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-on-primary transition active:bg-primary-pressed"
            type="button"
            onClick={onOpenScannerHelp}
          >
            <span aria-hidden="true" className="text-xl font-bold">
              ?
            </span>
          </Button>
        )}
      </div>
    </div>
  )
}
