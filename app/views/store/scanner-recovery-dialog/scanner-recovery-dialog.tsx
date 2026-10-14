import { useTranslation } from "react-i18next"

import { Button, Dialog } from "~/core"

import { ScannerRecoveryQrCode } from "./components/scanner-recovery-qr-code"

export function ScannerRecoveryDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { t } = useTranslation(["app", "common"])

  return (
    <Dialog.Root
      className="grid max-w-130 gap-6 p-8 text-center"
      open={open}
      onDismiss={onClose}
    >
      <div>
        <Dialog.Title>{t("scannerRecoveryTitle")}</Dialog.Title>
        <Dialog.Message className="mx-auto mt-4 max-w-97.5">
          {t("scannerRecoveryMessage")}
        </Dialog.Message>
      </div>

      <div className="mx-auto rounded-md border bg-default p-4">
        <ScannerRecoveryQrCode />
      </div>

      <Button className="mx-auto min-w-33 px-8" size="sm" onClick={onClose}>
        {t("common:actions.close")}
      </Button>
    </Dialog.Root>
  )
}
