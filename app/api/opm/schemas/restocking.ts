import { z } from "zod"

import {
  SetCurrentRestockingSkuErrors,
  type SetCurrentRestockingSkuErrorsName,
} from "../__generated__/opm-rpc"
import {
  enumNameOf,
  enumValue,
  isNoneEnum,
  maybe,
  parse,
} from "../../shared/fields"

/*
 * `error` is required, unlike nearly every other field: an answer without it
 * must read as unreadable (`null`), never as a success.
 */
const setCurrentRestockingSkuResponseSchema = z
  .looseObject({
    error: enumValue,
    errorDetail: z.unknown().optional(),
    // Absent when OPM did not check the lanes, which is not the same as none.
    incompatibleLanes: maybe(z.array(z.string())),
  })
  .transform(({ error, errorDetail, incompatibleLanes }) => ({
    /** The error's name, or `""` when the SKU was set. */
    error: errorNameOf(error, errorDetail),
    incompatibleLanes,
  }))

/** OPM sets `errorDetail` (always `{}`) alone when publishing the SKU to the shelf fails. */
function errorNameOf(
  error: number | string,
  errorDetail: unknown
): SetCurrentRestockingSkuErrorsName | "ShelvesError" | "" {
  if (!isNoneEnum(error)) {
    return enumNameOf(SetCurrentRestockingSkuErrors, error)
  }
  if (errorDetail != null) {
    return "ShelvesError"
  }
  return ""
}

type SetCurrentRestockingSkuResponse = z.output<
  typeof setCurrentRestockingSkuResponseSchema
>

/** `null` when the answer could not be read; the caller treats that as a refusal. */
export function readSetCurrentRestockingSkuResponse(
  value: unknown
): SetCurrentRestockingSkuResponse | null {
  return parse(
    setCurrentRestockingSkuResponseSchema,
    value,
    "set current restocking SKU"
  )
}
