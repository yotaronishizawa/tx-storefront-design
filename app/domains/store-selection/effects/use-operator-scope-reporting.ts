import { useEffect } from "react"

import { setOperatorScope } from "~/config/error-reporting"
import { useSession } from "~/domains/session"

import { useSelectedRobotId, useSelectedStoreId } from "../use-store-selection"

/** Keeps the signed-in agent, store and robot on every Sentry event. */
export function useOperatorScopeReporting() {
  const agentId = useSession()?.agentId ?? ""
  const storeId = useSelectedStoreId()
  const robotId = useSelectedRobotId()

  useEffect(() => {
    setOperatorScope({ agentId, storeId, robotId })
  }, [agentId, storeId, robotId])
}
