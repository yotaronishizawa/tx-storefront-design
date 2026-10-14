import { JobContextType } from "../__generated__/opm-rpc"
import { call } from "../client"
import { unwrapResponse } from "../errors"
import {
  readPnpJobDestination,
  readPnpJobOutcome,
  readPnpJobQueue,
  readPnpJobValidation,
  readPreparedManualPnpJob,
  type DisplayManualJob,
} from "../schemas"

/** OPM's job for refilling one display lane, or why it refused; `null` when unreadable. */
export async function prepareDisplayManualJob(
  robotId: string,
  locationId: string,
  token: string
) {
  return readPreparedManualPnpJob(
    unwrapResponse(
      await call("PrepareManualPnpJobSimple", [robotId, locationId], token)
    )
  )
}

/** OPM's checks on a prepared job; `null` when unreadable, which must stop the job. */
export async function validateDisplayManualJob(
  robotId: string,
  jobContext: object,
  token: string
) {
  return readPnpJobValidation(
    unwrapResponse(
      await call("ValidatePnpJobWithWarnings", [jobContext, robotId], token)
    )
  )
}

/** Queues a prepared job. OPM does not check it again, so validate it first. */
export async function publishDisplayManualJob(
  robotId: string,
  jobContext: object,
  token: string
) {
  await call("PublishManualJob", [robotId, jobContext], token)
}

/** The robot's PnP queue in OPM's order, each with the lane and drink it will place; unreadable jobs are left out. */
export async function getDisplayManualJobs(
  robotId: string,
  token: string
): Promise<DisplayManualJob[]> {
  const queue = readPnpJobQueue(
    await call("GetPnpJobResultQueue", [robotId], token)
  )
  const jobs = await Promise.all(
    queue.map(async (job) => {
      const destination = await call(
        "GetJob",
        [robotId, job.jobId, JobContextType.PickNPlace],
        token
      )
        .then(readPnpJobDestination)
        .catch(() => null)
      return destination ? { ...job, ...destination } : null
    })
  )
  return jobs.filter((job) => job !== null)
}

/** How a job the robot took ended; `null` when unreadable. */
export async function getDisplayManualJobOutcome(
  robotId: string,
  jobId: string,
  token: string
) {
  return readPnpJobOutcome(
    await call(
      "GetJobResult",
      [robotId, jobId, JobContextType.PickNPlace],
      token
    )
  )
}
