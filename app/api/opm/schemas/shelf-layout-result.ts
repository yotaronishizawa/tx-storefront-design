import { z } from "zod"

const responseSchema = z.object({
  error: z.union([z.number(), z.string()]),
  requestContext: z.object({ requestId: z.string() }).nullish(),
})

export type StartShelfLayoutResult = {
  error: number | string
  requestId: string
  disposition: "accepted" | "review" | "rejected"
}

/** A created SLCR can return an error after allocation or even after applying. */
export function readStartShelfLayoutResult(
  value: unknown
): StartShelfLayoutResult {
  const parsed = responseSchema.safeParse(value)
  if (!parsed.success)
    return {
      error: "UnrecognizedResponse",
      requestId: "",
      disposition: "review",
    }
  const { error, requestContext } = parsed.data
  const requestId = requestContext?.requestId ?? ""
  if ([0, "0", "None"].includes(error))
    return { error, requestId, disposition: "accepted" }
  // Creation failure with no created request is the only unambiguous rejection.
  // Error 1 is RequestCreatedSuccessfully in Unity; validation and layout-check
  // errors also happen after creating the SLCR in the current OPM use case.
  const rejected =
    !requestId && [2, "2", "CreateShelfLayoutRequestError"].includes(error)
  return { error, requestId, disposition: rejected ? "rejected" : "review" }
}
