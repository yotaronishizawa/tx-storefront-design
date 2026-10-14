import {
  getDisplayManualJobOutcome,
  getDisplayManualJobs,
  getDisplayShelfLocationHistories,
  getDisplayShelfLocations,
  getSkus,
  getStockShelfLocations,
} from "~/api/opm"
import type { DisplayManualJob, Store } from "~/api/opm/schemas"
import { findStuckStockLanes, isStuckAtStockOutcome } from "~/model/shelf"

import { readShelfState, selectSkuById } from "../shelf-store"

type DisplayContext = { storeId: string; robotId: string; token: string }

type DisplayPageContext = DisplayContext & { storeType: Store["storeType"] }

/**
 * Re-reads what the display page shows: the catalogue and the layout are
 * required, the history and the jobs are not. The edit page's working copy is
 * left alone. The queue read here is the baseline: jobs that left it earlier
 * were not watched, so they are not checked for stuck lanes.
 */
export async function reloadDisplayPage(context: DisplayPageContext) {
  const { storeId, storeType, token } = context
  const [skus, displayLocations] = await Promise.all([
    getSkus(storeType, token),
    getDisplayShelfLocations(storeId, token),
  ])
  const shelf = readShelfState()
  shelf.setSkus(skus)
  shelf.setDisplayLocations(displayLocations)

  await Promise.all([
    getDisplayShelfLocationHistories(storeId, token)
      .then(readShelfState().setDisplayHistories)
      .catch(() => undefined),
    readDisplayManualJobs(context).catch(() => undefined),
  ])
}

async function readDisplayManualJobs({ robotId, token }: DisplayContext) {
  if (!robotId) {
    readShelfState().setDisplayManualJobs([])
    return
  }
  const jobs = await getDisplayManualJobs(robotId, token)
  readShelfState().setDisplayManualJobs(listKnownJobs(jobs))
}

/**
 * Reads the robot's queue into the store, then checks each job that left it
 * since the last read for a drink stuck in its stock lane.
 */
export async function syncDisplayManualJobs(context: DisplayContext) {
  const { robotId, token } = context
  if (!robotId) {
    return
  }
  const jobs = await getDisplayManualJobs(robotId, token)
  const previous = readShelfState().displayManualJobs
  // The page closed, or its first read has not landed yet.
  if (!previous) {
    return
  }
  const stillQueued = new Set(jobs.map((job) => job.jobId))
  const dequeued = previous.filter((job) => !stillQueued.has(job.jobId))
  readShelfState().setDisplayManualJobs(listKnownJobs(jobs))

  for (const job of dequeued) {
    await offerStuckLanesAfterJob(job, context).catch(() => undefined)
  }
}

// A job for a drink the catalogue lacks is not listed.
function listKnownJobs(jobs: DisplayManualJob[]) {
  const skuById = selectSkuById(readShelfState())
  return jobs.filter((job) => skuById.has(job.skuId))
}

async function offerStuckLanesAfterJob(
  job: DisplayManualJob,
  context: DisplayContext
) {
  const outcome = await getDisplayManualJobOutcome(
    context.robotId,
    job.jobId,
    context.token
  )
  // Nothing to offer once the page has closed.
  if (!readShelfState().displayManualJobs) {
    return
  }
  if (!outcome || !isStuckAtStockOutcome(outcome)) {
    return
  }
  await offerStuckLanesFor(job.skuId, context)
}

/** Offers the operator the stock lanes holding `skuId` that are stuck; `false` when none are. */
export async function offerStuckLanesFor(
  skuId: string,
  { storeId, token }: DisplayContext
): Promise<boolean> {
  const stockLocations = await getStockShelfLocations(storeId, token)
  readShelfState().setStockLocations(stockLocations)
  const stuck = findStuckStockLanes(stockLocations, skuId)
  readShelfState().offerStuckLanes(stuck)
  return stuck.length > 0
}
