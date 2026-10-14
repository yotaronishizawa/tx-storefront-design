import { setStockLaneAvailable } from "~/api/opm"
import { readAppShellState } from "~/domains/app-shell"
import { runBusy } from "~/domains/operations"
import { useSession } from "~/domains/session"
import { useSelectedStoreId } from "~/domains/store-selection"
import { translate } from "~/initializer/i18n"

import { readShelfState } from "../shelf-store"

/** The operator's answer to the stuck-lane offer. */
export function useStuckLaneActions() {
  const session = useSession()
  const storeId = useSelectedStoreId()

  /** The operator slid the drinks forward: turn every offered lane back on. */
  async function markStuckLanesFixed() {
    const locationIds = readShelfState().stuckLaneIds
    readShelfState().clearStuckLanes()
    if (!session || !storeId || locationIds.length === 0) {
      return
    }

    await runBusy("reset-stuck-lanes", async () => {
      const results = await Promise.allSettled(
        locationIds.map((locationId) =>
          setStockLaneAvailable(storeId, locationId, session.token)
        )
      )
      if (results.some((result) => result.status === "rejected")) {
        readAppShellState().setError(
          `${translate("stuckLaneResetFailed")}\n${translate("displayReservationCallCenter")}`
        )
      }
    })
  }

  /** The operator leaves the lanes to the operations team. */
  function waitForOperationsTeam() {
    readShelfState().clearStuckLanes()
  }

  return { markStuckLanesFixed, waitForOperationsTeam }
}
