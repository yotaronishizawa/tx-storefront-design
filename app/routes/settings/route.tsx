import { APP_VERSION_LABEL } from "~/config/app"
import {
  IDLE_TIMEOUT_OPTIONS_MS,
  setIdleTimeoutMs,
  useBusyAction,
  useIdleTimeoutMs,
} from "~/domains/app-shell"
import { signOutSession } from "~/domains/reset-domain-stores"
import { useStoreRefreshAction } from "~/domains/shelf"
import {
  useChangeStore,
  useSelectedStoreId,
  useStores,
} from "~/domains/store-selection"
import { useOnlineStatus } from "~/hooks/use-online-status"
import { SettingsView } from "~/views/store/settings"

export default function SettingsPage() {
  const stores = useStores()
  const selectedStoreId = useSelectedStoreId()
  const changeStore = useChangeStore()
  const busyAction = useBusyAction()
  const isOnline = useOnlineStatus()
  const refreshAll = useStoreRefreshAction()
  const idleTimeoutMs = useIdleTimeoutMs()

  return (
    <SettingsView
      appVersion={APP_VERSION_LABEL}
      busyAction={busyAction}
      idleTimeoutMs={idleTimeoutMs}
      idleTimeoutOptionsMs={IDLE_TIMEOUT_OPTIONS_MS}
      onIdleTimeoutChange={(ms) => {
        const option = IDLE_TIMEOUT_OPTIONS_MS.find((value) => value === ms)
        // 0 is "Off", so test for a match, not truthiness.
        if (option !== undefined) setIdleTimeoutMs(option)
      }}
      isOnline={isOnline}
      selectedStoreId={selectedStoreId}
      stores={stores}
      onRefresh={refreshAll}
      onSignOut={signOutSession}
      onStoreChange={changeStore}
    />
  )
}
