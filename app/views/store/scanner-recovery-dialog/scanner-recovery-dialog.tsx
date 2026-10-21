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
    <Dialog.Popup
      open={open}
      onClose={onClose}
      closeLabel={t("common:actions.close")}
      title={t("scannerRecoveryTitle")}
      actions={
        <Dialog.Actions>
          <Button size="lg" onClick={onClose}>
            {t("common:actions.close")}
          </Button>
        </Dialog.Actions>
      }
    >
      <Dialog.Message className="text-left font-normal">
        {t("scannerRecoveryMessage")}
      </Dialog.Message>

      <div className="mx-auto rounded-md border bg-default p-4">
        <ScannerRecoveryQrCode />
      </div>
    </Dialog.Popup>
  )
}
