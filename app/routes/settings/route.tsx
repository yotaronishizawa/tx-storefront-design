import { useNavigate, useSearchParams } from "react-router"

import { APP_VERSION_LABEL } from "~/config/app"
import {
  IDLE_TIMEOUT_MAX_MINUTES,
  IDLE_TIMEOUT_MIN_MINUTES,
  IDLE_TIMEOUT_OPTIONS_MS,
  setIdleTimeoutMs,
  useBusyAction,
  useIdleTimeoutMs,
} from "~/domains/app-shell"
import { signOutSession } from "~/domains/reset-domain-stores"
import { useSession } from "~/domains/session"
import { useStoreRefreshAction } from "~/domains/shelf"
import {
  useChangeStore,
  useSelectedStoreId,
  useStores,
} from "~/domains/store-selection"
import { useOnlineStatus } from "~/hooks/use-online-status"
import { AccountView, SettingsView } from "~/views/store/settings"

/** `?account` opens the Account screen, where sign out lives. */
const ACCOUNT_PARAM = "account"

export default function SettingsPage() {
  const stores = useStores()
  const selectedStoreId = useSelectedStoreId()
  const changeStore = useChangeStore()
  const busyAction = useBusyAction()
  const isOnline = useOnlineStatus()
  const refreshAll = useStoreRefreshAction()
  const idleTimeoutMs = useIdleTimeoutMs()
  const agentId = useSession()?.agentId ?? ""
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  if (searchParams.has(ACCOUNT_PARAM)) {
    return (
      <AccountView
        agentId={agentId}
        onBack={() => {
          // Back to the Settings entry that opened it; opened directly, swap in place.
          const idx = (window.history.state as { idx?: number } | null)?.idx
          void (idx
            ? navigate(-1)
            : navigate({ search: "" }, { replace: true }))
        }}
        onSignOut={signOutSession}
      />
    )
  }

  return (
    <SettingsView
      appVersion={APP_VERSION_LABEL}
      busyAction={busyAction}
      idleTimeoutMs={idleTimeoutMs}
      idleTimeoutOptionsMs={IDLE_TIMEOUT_OPTIONS_MS}
      idleTimeoutMinutesRange={[
        IDLE_TIMEOUT_MIN_MINUTES,
        IDLE_TIMEOUT_MAX_MINUTES,
      ]}
      // Values outside the presets and the minute range are ignored.
      onIdleTimeoutChange={setIdleTimeoutMs}
      isOnline={isOnline}
      selectedStoreId={selectedStoreId}
      stores={stores}
      onRefresh={refreshAll}
      onOpenAccount={() => void navigate({ search: `?${ACCOUNT_PARAM}` })}
      onStoreChange={changeStore}
    />
  )
}
