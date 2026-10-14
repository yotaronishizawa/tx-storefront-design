import { z } from "zod"

import { HumanOperatorAccessLevel } from "../__generated__/opm-rpc"
import { enumName, list, parse } from "../../shared/fields"

/** The signed-in account. A robot account has no `access`. */
const agentSchema = z.looseObject({
  id: z.string(),
  access: enumName(HumanOperatorAccessLevel),
  availableStores: list(z.string(), "available stores"),
})

export type Agent = z.output<typeof agentSchema>

export function readAgent(value: unknown): Agent | null {
  return parse(agentSchema, value, "agent")
}
