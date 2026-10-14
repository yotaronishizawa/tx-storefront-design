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
    <Dialog.Root
      className="flex max-w-dialog flex-col items-center gap-6 px-8 py-12"
      open={open}
      role="alertdialog"
    >
      {failed ? (
        <WifiOff aria-hidden className="size-12 text-error" />
      ) : (
        <Loader2
          aria-hidden
          className="size-12 animate-spin text-primary-text"
        />
      )}
      <Dialog.Message className="text-center">
        {failed ? t("opmReconnectionFailed") : t("opmConnecting")}
      </Dialog.Message>
      {failed && (
        <Button icon={<RotateCw />} type="button" onClick={onReconnect}>
          {t("opmReconnect")}
        </Button>
      )}
    </Dialog.Root>
  )
}
