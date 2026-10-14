import type { ReactNode } from "react"

import { useAppUpdateWatch, useOpmConnectionWatch } from "~/domains/app-shell"
import { useActiveRequestsPoll } from "~/domains/operations"
import { signOutSession } from "~/domains/reset-domain-stores"
import {
  useLocalShelfConnection,
  useRestockingScannerEvents,
  useRestockingSessionTracking,
  useScanAlertOverlayReport,
  useStockShelfLaneUpdates,
} from "~/domains/restocking"
import {
  useNoRobotNotice,
  useRobotLockOverlayReport,
  useRobotNotifications,
  useRobotStateLoader,
} from "~/domains/robot"
import { useSessionActions, useSessionStartup } from "~/domains/session"
import { useStoreDataLoader } from "~/domains/shelf"
import {
  useOperatorScopeReporting,
  useSelectedStorePersistence,
  useStoreListLoader,
  useStoreLoadingToast,
} from "~/domains/store-selection"
import { useOnlineStatus } from "~/hooks/use-online-status"

import { useAppUpdateAutoApply } from "../_hooks/use-app-update-auto-apply"
import { useManualReplenishmentPrompt } from "../_hooks/use-manual-replenishment-prompt"
import { useNetworkStatusToast } from "../_hooks/use-network-status-toast"
import { useSignalRTokenRefresh } from "../_hooks/use-signalr-token-refresh"

/**
 * Runs the subscriptions, polls and bootstraps that must outlive any one page,
 * e.g. scanner events, since restocking continues while the operator changes screen.
 */
export function StoreRuntimeProvider({ children }: { children: ReactNode }) {
  const isOnline = useOnlineStatus()
  const { signInWithCredentials } = useSessionActions()

  // Boot: resolve the stored session once.
  useSessionStartup({ signInWithCredentials })
  useSignalRTokenRefresh({ signInWithCredentials })

  // Who and where, on every Sentry event.
  useOperatorScopeReporting()

  // Transports, and the connection state the footer shows on every page.
  useLocalShelfConnection()
  useOpmConnectionWatch()

  // Data: the store list, then everything about the selected store.
  useStoreListLoader({ signOut: signOutSession })
  useSelectedStorePersistence()
  useStoreDataLoader({ signOut: signOutSession })
  useActiveRequestsPoll()
  useRobotStateLoader()

  // The live restocking session.
  useRestockingSessionTracking()
  useStockShelfLaneUpdates()
  useRestockingScannerEvents()
  useScanAlertOverlayReport()

  // App-wide operator feedback.
  useNetworkStatusToast(isOnline)
  useStoreLoadingToast()
  useManualReplenishmentPrompt()
  useRobotNotifications()
  useNoRobotNotice()
  useRobotLockOverlayReport()

  // New builds: the banner's flag, and the reload once the tablet sits idle.
  useAppUpdateWatch()
  useAppUpdateAutoApply()

  return children
}
