import { z } from "zod"

import { SignInErrorCode } from "../__generated__/opm-rpc"
import { enumName, parse, text } from "../../shared/fields"

const signInResultSchema = z.looseObject({
  signInErrorCode: enumName(SignInErrorCode),
  token: text,
})

export type SignInResult = z.output<typeof signInResultSchema>

export function readSignInResult(value: unknown): SignInResult | null {
  return parse(signInResultSchema, value, "sign-in result")
}

/** What the app keeps between reloads: who signed in, and OPM's token. */
export const authSessionSchema = z.looseObject({
  agentId: z.string(),
  token: z.string().min(1),
})

export type AuthSession = z.output<typeof authSessionSchema>

/** What the operator types to sign in. */
export type Credentials = { agentId: string; password: string }
