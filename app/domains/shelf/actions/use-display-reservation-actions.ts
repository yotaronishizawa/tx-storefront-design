import {
  getDisplayShelfLocations,
  getSmartShelvesStatus,
  prepareDisplayManualJob,
  publishDisplayManualJob,
  validateDisplayManualJob,
} from "~/api/opm"
import { readAppShellState, type DialogKind } from "~/domains/app-shell"
import { runBusy, withSupportCodes } from "~/domains/operations"
import {
  readRobotState,
  selectRobotOperationMode,
  selectRobotWorkStatus,
} from "~/domains/robot"
import { useSession } from "~/domains/session"
import {
  readStoreSelectionState,
  selectSelectedStore,
  useSelectedRobotId,
} from "~/domains/store-selection"
import { translate } from "~/initializer/i18n"
import {
  getPrepareRefusal,
  getReservationVerdict,
  getRobotReservationBlock,
  getShelfReadiness,
  type IllustratedRefusal,
  type ReservationRefusal,
} from "~/model/display-reservation"
import { getLocationSkuId } from "~/model/shelf"
import { isCutProduct } from "~/model/sku"
import { isLocalV2Store } from "~/model/store-display"

import {
  offerStuckLanesFor,
  syncDisplayManualJobs,
} from "../services/display-page-data"
import { readShelfState, selectSkuById } from "../shelf-store"

const ILLUSTRATED_DIALOGS: Record<IllustratedRefusal, DialogKind> = {
  "source-blocked": "display-source-blocked",
  "source-not-enough": "display-source-not-enough",
}

/** Reserving a display lane for the robot to refill. */
export function useDisplayReservationActions() {
  const session = useSession()
  const selectedRobotId = useSelectedRobotId()

  /**
   * Prepares, validates and publishes a job. A job with overfill or needs-scan
   * warnings waits for the operator's confirmation, then publishes the job
   * already prepared, as the store app does.
   */
  async function reserveDisplayLane(locationId: string): Promise<void> {
    const shell = readAppShellState()
    const store = selectSelectedStore(readStoreSelectionState())
    if (!session || !selectedRobotId || !store || !locationId) {
      return
    }
    const { token } = session
    const storeId = store.id
    const context = { storeId, robotId: selectedRobotId, token }
    const busyAction = `display-manual-job:${locationId}` as const
    const formatError = () => translate("displayReservationFailed")

    const robotState = readRobotState()

    // A stale `RestPosition` could send the robot at a shelf an operator is standing in.
    if (robotState.statusStale) {
      shell.setError(translate("robotStatusStale"))
      return
    }

    const robotBlock = getRobotReservationBlock(
      selectRobotWorkStatus(robotState),
      selectRobotOperationMode(robotState)
    )
    if (robotBlock) {
      shell.setError(translate(robotBlock))
      return
    }

    const shelfState = readShelfState()
    const location = shelfState.displayLocations.find(
      (item) => item.id === locationId
    )
    const sku = location
      ? selectSkuById(shelfState).get(getLocationSkuId(location))
      : undefined
    if (isCutProduct(sku)) {
      shell.setError(translate("displayReservationCutProduct"))
      return
    }

    // Reloads only the display layout; the open cabinet stays.
    async function refuse(refusal: ReservationRefusal) {
      if (refusal.illustrated) {
        shell.openDialog(ILLUSTRATED_DIALOGS[refusal.illustrated])
      } else {
        shell.setError(refusalMessage(refusal))
      }
      if (!refusal.reloadLayout) {
        return
      }
      readShelfState().selectCell(null)
      await getDisplayShelfLocations(storeId, token)
        .then(readShelfState().setDisplayLocations)
        .catch(() => undefined)
    }

    const checked = await runBusy(
      busyAction,
      async () => {
        const prepared = await prepareDisplayManualJob(
          selectedRobotId,
          locationId,
          token
        )
        // First offer any jammed stock lane the operator can clear.
        if (
          prepared?.errorCode === "AllSourceWithSkuNotAvailable" &&
          location &&
          (await offerStuckLanesFor(getLocationSkuId(location), context).catch(
            () => false
          ))
        ) {
          return null
        }
        if (prepared && prepared.errorCode !== "None") {
          await refuse(getPrepareRefusal(prepared.errorCode))
          return null
        }
        if (!prepared?.jobContext) {
          shell.setError(translate("displayReservationFailed"))
          return null
        }

        const validation = await validateDisplayManualJob(
          selectedRobotId,
          prepared.jobContext,
          token
        )
        if (!validation) {
          shell.setError(translate("displayReservationFailed"))
          return null
        }

        const shelf =
          validation.warnings.includes("SmartShelfClientNotEnabled") &&
          isLocalV2Store(store)
            ? getShelfReadiness(
                await getSmartShelvesStatus(store.id, token),
                Date.now()
              )
            : null
        const verdict = getReservationVerdict(validation, shelf)
        if (verdict.kind === "refuse") {
          await refuse(verdict.refusal)
          return null
        }
        return {
          jobContext: prepared.jobContext,
          needsConfirm: verdict.kind === "confirm",
        }
      },
      { formatError }
    )
    if (!checked) {
      return
    }

    if (checked.needsConfirm) {
      const choice = await shell.askOperator({
        buttons: "confirmed-cancel",
        home: false,
        message: translate("displayReservationConfirmRisk"),
      })
      if (choice !== "confirm") {
        return
      }
    }

    await runBusy(
      busyAction,
      async () => {
        await publishDisplayManualJob(
          selectedRobotId,
          checked.jobContext,
          token
        )
        shell.setNotice(translate("displayReservationAccepted"))
        await syncDisplayManualJobs(context).catch(() => undefined)
      },
      { formatError }
    )
  }

  return { reserveDisplayLane }
}

function refusalMessage({
  message,
  callCenter,
  codes,
}: ReservationRefusal): string {
  const text = callCenter
    ? `${translate(message)}\n${translate("displayReservationCallCenter")}`
    : translate(message)
  return withSupportCodes(text, codes)
}
