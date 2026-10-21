import { Loader2, RotateCw, WifiOff } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button, Dialog } from "~/core"

/**
 * Blocks everything while OPM is unreachable, so nothing is tapped against a
 * dead connection. Closes by itself on reconnect; once reconnecting has failed
 * for a while it also offers Reconnect.
 */
export function ConnectingDialog({
  failed,
  open,
  onReconnect,
}: {
  failed: boolean
  open: boolean
  onReconnect: () => void
}) {
  const { t } = useTranslation("app")

  return (
    <Dialog.Popup
      open={open}
      role="alertdialog"
      actions={
        failed && (
          <Dialog.Actions>
            <Button
              size="lg"
              icon={<RotateCw />}
              type="button"
              onClick={onReconnect}
            >
              {t("opmReconnect")}
            </Button>
          </Dialog.Actions>
        )
      }
    >
      <div className="flex flex-col items-center gap-4 py-4">
        {failed ? (
          <WifiOff aria-hidden className="size-12 text-error" />
        ) : (
          <Loader2
            aria-hidden
            className="size-12 animate-spin text-primary-text"
          />
        )}
        <Dialog.Message className="font-normal">
          {failed ? t("opmReconnectionFailed") : t("opmConnecting")}
        </Dialog.Message>
      </div>
    </Dialog.Popup>
  )
}
