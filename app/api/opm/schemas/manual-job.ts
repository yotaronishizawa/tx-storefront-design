import { z } from "zod"

import {
  InvalidPnpJobContextReason,
  JobResultStatus,
  PnpJobContextWarning,
  PrepareManualPnpJobErrorCode,
  TeleopErrorCode,
  type InvalidPnpJobContextReasonName,
  type PnpJobContextWarningName,
  type PrepareManualPnpJobErrorCodeName,
} from "../__generated__/opm-rpc"
import {
  enumName,
  enumNameOf,
  enumValue,
  isNoneEnum,
  list,
  parse,
  text,
} from "../../shared/fields"

/** One job in the robot's PnP queue. It names the job, not the lane or drink it will place. */
const queuedPnpJobSchema = z.looseObject({
  jobId: z.string(),
  createTimestamp: z.number(),
})

type QueuedPnpJob = z.output<typeof queuedPnpJobSchema>

/** The queue in OPM's order, which is the order the robot runs it in. */
export function readPnpJobQueue(value: unknown): QueuedPnpJob[] {
  return list(queuedPnpJobSchema, "manual jobs").parse(value)
}

const pnpJobContextSchema = z.looseObject({
  destinations: list(
    z.looseObject({ locationId: text, skuId: text }),
    "manual job destinations"
  ),
})

/**
 * The display lane and drink a published job will place: its first
 * destination. `null` for a job with none.
 *
 * @example readPnpJobDestination({ destinations: [{ locationId: "d1", skuId: "s1" }] }) // { locationId: "d1", skuId: "s1" }
 */
export function readPnpJobDestination(
  value: unknown
): { locationId: string; skuId: string } | null {
  const context = parse(pnpJobContextSchema, value, "manual job context")
  const destination = context?.destinations[0]
  return destination?.skuId ? destination : null
}

/** A queued job with the lane and drink it will place. */
export type DisplayManualJob = QueuedPnpJob & {
  locationId: string
  skuId: string
}

const pnpJobResultSchema = z.looseObject({
  currentStatus: enumName(JobResultStatus),
  errorCode: enumName(TeleopErrorCode),
})

type PnpJobOutcome = z.output<typeof pnpJobResultSchema>

/** How a job the robot took ended, or `null` when unreadable. */
export function readPnpJobOutcome(value: unknown): PnpJobOutcome | null {
  return parse(pnpJobResultSchema, value, "manual job result")
}

const preparedManualPnpJobSchema = z.looseObject({
  errorCode: enumName(PrepareManualPnpJobErrorCode),
  // Sent on to OPM as it came, to validate and then publish.
  pnpJobContext: z.looseObject({}).nullish(),
})

/**
 * OPM's prepared job: `errorCode` is `"None"` when it prepared one. `null`
 * when the answer cannot be read.
 *
 * @example readPreparedManualPnpJob({ errorCode: 12, pnpJobContext: null }) // { errorCode: "AllSourceWithSkuPendingPnp", jobContext: null }
 */
export function readPreparedManualPnpJob(value: unknown): {
  errorCode: PrepareManualPnpJobErrorCodeName | "None"
  jobContext: object | null
} | null {
  const prepared = parse(
    preparedManualPnpJobSchema,
    value,
    "prepared manual job"
  )
  if (!prepared) {
    return null
  }
  return {
    errorCode: isNoneEnum(prepared.errorCode)
      ? "None"
      : (prepared.errorCode as PrepareManualPnpJobErrorCodeName),
    jobContext: prepared.pnpJobContext ?? null,
  }
}

const pnpJobValidationSchema = z.looseObject({
  // Required: an answer without it says nothing about the job, so it must stop it.
  invalidPnpJobContextReason: enumValue,
  warnings: list(enumName(PnpJobContextWarning), "manual job warnings"),
})

export type PnpJobValidation = {
  reason: InvalidPnpJobContextReasonName
  warnings: PnpJobContextWarningName[]
}

/**
 * OPM's verdict on a prepared job, as names; a name this build does not know
 * is kept as sent. `null` when the answer cannot be read.
 *
 * @example readPnpJobValidation({ invalidPnpJobContextReason: 15, warnings: [202] }) // { reason: "DestinationFull", warnings: ["SmartShelvesNotReady"] }
 */
export function readPnpJobValidation(value: unknown): PnpJobValidation | null {
  const validation = parse(
    pnpJobValidationSchema,
    value,
    "manual job validation"
  )
  if (!validation) {
    return null
  }
  return {
    reason: reasonNameOf(validation.invalidPnpJobContextReason),
    warnings: validation.warnings.filter(
      (warning): warning is PnpJobContextWarningName => warning !== undefined
    ),
  }
}

/** The name may arrive qualified, as `InvalidPnpJobContextReason.DestinationFull`. */
function reasonNameOf(raw: number | string): InvalidPnpJobContextReasonName {
  if (isNoneEnum(raw)) {
    return "None"
  }
  const name = enumNameOf(InvalidPnpJobContextReason, raw)
  return (name.split(".").pop() || "None") as InvalidPnpJobContextReasonName
}
