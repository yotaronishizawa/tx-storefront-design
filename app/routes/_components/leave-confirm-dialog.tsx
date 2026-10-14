import { useBlocker } from "react-router"

import { ConfirmDialog } from "~/components/dialog/confirm-dialog"

/** Asks before leaving the page while `shouldBlock()`, read at navigation time, holds. */
export function LeaveConfirmDialog({
  cancelLabel,
  confirmLabel,
  message,
  shouldBlock,
  onLeave,
}: {
  cancelLabel: string
  confirmLabel: string
  message: string
  shouldBlock: () => boolean
  onLeave?: () => void
}) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      currentLocation.pathname !== nextLocation.pathname && shouldBlock()
  )

  return (
    <ConfirmDialog
      cancelLabel={cancelLabel}
      confirmLabel={confirmLabel}
      message={message}
      open={blocker.state === "blocked"}
      onCancel={() => blocker.reset?.()}
      onConfirm={() => {
        onLeave?.()
        blocker.proceed?.()
      }}
    />
  )
}
