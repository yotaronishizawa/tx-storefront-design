/** Manual pick-and-place jobs on the display shelf. */
import { state } from "../state.mjs"
import { unixSeconds } from "../utils/time.mjs"
import { withErrors } from "./define.mjs"
import {
  INVALID_PNP_JOB_CONTEXT_REASONS,
  PREPARE_MANUAL_PNP_JOB_ERRORS,
} from "./errors.mjs"

// `JobContextType.PickNPlace` and `JobResult.Status` (`JobManager/Entities/JobResult.cs`).
const PICK_N_PLACE = 1
const JOB_STATUS = { received: 1, completed: 3, cancelled: 4 }

export const manualPnpMethods = {
  // `List<PnpJobResult>`: the robot's queue, which names each job but not the
  // lane or drink it will place. A completed or cancelled job leaves it.
  GetPnpJobResultQueue: () =>
    state.displayManualJobs.filter(
      (job) =>
        job.currentStatus !== JOB_STATUS.completed &&
        job.currentStatus !== JOB_STATUS.cancelled
    ),
  PrepareManualPnpJobSimple: withErrors(
    ([, locationId]) => prepareManualPnpJob(String(locationId ?? "")),
    PREPARE_MANUAL_PNP_JOB_ERRORS,
    (errorCode) => ({
      errorCode,
      errorMessage: PREPARE_MANUAL_PNP_JOB_ERRORS[errorCode],
      manualPnpJobSituation: null,
      pnpJobContext: null,
    })
  ),
  // `ValidatePnpJobResult`. The warnings come from `/sim/manual-job/warnings`:
  // overfill and needs-scan ones ask the operator to confirm, the rest refuse.
  ValidatePnpJobWithWarnings: withErrors(
    ([, robotId]) => ({
      invalidPnpJobContextReason: 0,
      warnings: validationWarnings(robotId),
      isValid: true,
    }),
    INVALID_PNP_JOB_CONTEXT_REASONS,
    (reason) => ({
      invalidPnpJobContextReason: reason,
      warnings: state.pnpJobWarnings,
      isValid: false,
    })
  ),
  // `GetJob(robotId, jobId, type)`: the context a manual job was published
  // with, or `null` for a job OPM never saw.
  GetJob: ([, jobId]) => state.manualJobs[String(jobId ?? "")]?.context ?? null,
  // `GetJobResult(robotId, jobId, type)`: a `PnpJobResult`, moved on by
  // `/sim/manual-job/result`.
  GetJobResult: ([, jobId]) =>
    state.manualJobs[String(jobId ?? "")]?.result ?? null,
  // Also answers as `PublishManualJob`, an OPM alias. OPM's method is void, so `Call` answers `null`.
  RequestManualJob: ([, jobContext]) => {
    publishManualJob(jobContext ?? {})
    return null
  },
}

// `PnpValidator.cs:534`: with no shelf client, OPM cannot check the shelf mode
// and says so with `SmartShelfClientNotEnabled` (299).
function validationWarnings(robotId) {
  const store = state.stores.find((item) => item.robotId === robotId)
  const shelfClientEnabled =
    store?.config?.smartShelves?.shelfClientEnabled ?? true
  return shelfClientEnabled
    ? state.pnpJobWarnings
    : [...state.pnpJobWarnings, 299]
}

function findDisplayLocation(id) {
  return state.displayLocations.find((item) => item.id === id)
}

// `ManualPnpPreparer.cs:145`: every usable stock lane for the drink is off.
const ALL_SOURCE_WITH_SKU_NOT_AVAILABLE = 11

function prepareManualPnpJob(locationId) {
  const location = findDisplayLocation(locationId)
  const sources = state.stockLocations.filter(
    (lane) => lane.skuId === location?.skuId && !lane.isBlackList
  )
  if (
    sources.length > 0 &&
    sources.every((lane) => lane.isAvailable === false)
  ) {
    return {
      errorCode: ALL_SOURCE_WITH_SKU_NOT_AVAILABLE,
      errorMessage:
        PREPARE_MANUAL_PNP_JOB_ERRORS[ALL_SOURCE_WITH_SKU_NOT_AVAILABLE],
      manualPnpJobSituation: null,
      pnpJobContext: null,
    }
  }
  return {
    errorCode: 0,
    errorMessage: null,
    manualPnpJobSituation: { isAvailableToNewManualJob: true, jobs: [] },
    pnpJobContext: {
      jobId: `SIM-PNP-${Date.now()}`,
      location: locationId,
      skuId: location?.skuId ?? "",
      destinations: [
        {
          locationId: locationId,
          skuId: location?.skuId ?? "",
        },
      ],
    },
  }
}

function publishManualJob(jobContext) {
  const jobId = String(
    jobContext.jobId ?? `SIM-MANUAL-JOB-${state.displayManualJobs.length + 1}`
  )
  const result = {
    agentId: state.robot.id,
    jobId,
    currentStatus: JOB_STATUS.received,
    timestamp: unixSeconds(),
    type: PICK_N_PLACE,
    isManualJob: true,
    createTimestamp: unixSeconds(),
    errorCode: 0,
  }
  state.displayManualJobs.push(result)
  state.manualJobs[jobId] = {
    context: { ...jobContext, jobId, type: PICK_N_PLACE },
    result,
  }
}
