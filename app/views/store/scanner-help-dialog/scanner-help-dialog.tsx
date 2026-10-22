import { useState } from "react"

import { useTranslation } from "react-i18next"

import { SupportContact } from "~/components/support/support-contact"
import { Button, Dialog } from "~/core"

const ASSETS = "/assets/scanner-help"

const PHOTOS = [
  { file: "silver-box.jpg", caption: "scannerHelp.photoSilverBox" },
  { file: "usb-port.jpg", caption: "scannerHelp.photoUsbPort" },
  { file: "dongle.jpg", caption: "scannerHelp.photoDongle" },
] as const

const STEPS = [
  { text: "scannerHelp.step1", qr: false },
  { text: "scannerHelp.step2", qr: true },
  { text: "scannerHelp.step3", qr: true },
  { text: "scannerHelp.step4", qr: false },
] as const

/**
 * The scanner is not connected: first check the dongle (with photos of
 * where it sits), then, if that does not help, re-pair the scanner step by
 * step, with the operations centre's number at the foot.
 */
export function ScannerHelpDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { t } = useTranslation(["app", "common"])
  const [page, setPage] = useState<"check" | "pair">("check")
  const close = () => {
    onClose()
    setPage("check")
  }

  if (page === "pair") {
    return (
      <Dialog.Popup
        open={open}
        onClose={close}
        closeLabel={t("common:actions.close")}
        title={t("scannerHelp.title")}
        size="wide"
        actions={
          <Dialog.Actions>
            <Button size="lg" onClick={() => setPage("check")}>
              {t("common:actions.back")}
            </Button>
          </Dialog.Actions>
        }
      >
        <ol className="flex flex-col gap-4 rounded-lg bg-subtle p-5">
          {STEPS.map((step, index) => (
            <li key={step.text} className="flex flex-col gap-3">
              <p className="font-bold">
                <span className="me-2">STEP.{index + 1}</span>
                {t(step.text)}
              </p>
              {/* The real codes (2.4G wireless mode, pairing) are not in the
                  app yet: a placeholder that cannot be scanned by mistake. */}
              {step.qr && (
                <div className="grid size-36 place-items-center rounded-md border-2 border-dashed border-strong bg-default p-3 text-center text-sm text-secondary">
                  {t("scannerHelp.qrPending")}
                </div>
              )}
            </li>
          ))}
        </ol>
        <SupportContact message={t("scannerHelp.contact")} />
      </Dialog.Popup>
    )
  }

  return (
    <Dialog.Popup
      open={open}
      onClose={close}
      closeLabel={t("common:actions.close")}
      title={t("scannerHelp.title")}
      size="wide"
      actions={
        <Dialog.Actions>
          <Button size="lg" onClick={() => setPage("pair")}>
            {t("scannerHelp.toPairing")}
          </Button>
          <Button size="lg" variant="secondary" onClick={close}>
            {t("common:actions.close")}
          </Button>
        </Dialog.Actions>
      }
    >
      <div className="flex flex-col gap-4 rounded-lg bg-subtle p-5">
        <p className="font-bold">{t("scannerHelp.checkDongle")}</p>
        <ul className="grid grid-cols-3 gap-4">
          {PHOTOS.map((photo) => (
            <li key={photo.file}>
              <figure className="flex flex-col gap-2">
                <img
                  src={`${ASSETS}/${photo.file}`}
                  alt={t(photo.caption)}
                  className="aspect-video w-full rounded-lg bg-default object-cover"
                />
                <figcaption className="text-center text-base">
                  {t(photo.caption)}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </Dialog.Popup>
  )
}
