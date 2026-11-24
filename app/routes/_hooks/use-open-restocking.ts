import { useNavigate } from "react-router"

import { isRestockStudy } from "~/config/restock-study"
import { ROUTES } from "~/config/routes"
import { useRestockRequest } from "~/domains/operations"
import { isRequestInProgress } from "~/model/request-state"

/**
 * Restocking from Home or the drinks-to-restock list. In the restock study
 * there is no "on the restocking screen but not started" state: it starts
 * straight away on the start screen, in the walk-in's frame (no rules popup),
 * and the restocking screen opens already started. That state let staff
 * remove drinks and scan outside a session.
 */
export function useOpenRestocking(): () => void {
  const navigate = useNavigate()
  const restockRequest = useRestockRequest()

  return () => {
    if (isRestockStudy() && !isRequestInProgress(restockRequest)) {
      void navigate(ROUTES.restockStart().pathname)
      return
    }
    void navigate(ROUTES.restocking().pathname)
  }
}
