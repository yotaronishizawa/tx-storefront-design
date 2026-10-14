import { createLogger } from "~/config/logger"

const KIND_STYLES = {
  ERROR: "color: #dc2626; font-weight: bold",
  EVENT: "color: #9333ea; font-weight: bold",
  REQUEST: "color: #2563eb; font-weight: bold",
  RESPONSE: "color: #16a34a; font-weight: bold",
  SUBSCRIBE: "color: #d97706; font-weight: bold",
  UNSUBSCRIBE: "color: #d97706; font-weight: bold",
} as const

type WireLogKind = keyof typeof KIND_STYLES

export type WireLog = (
  kind: WireLogKind,
  name: string,
  payload?: unknown
) => void

/** Logs hub traffic as `[scope] [KIND] [name]` with the payload underneath. */
export function createWireLog(scope: string): WireLog {
  const logger = createLogger(scope)
  return (kind, name, payload) =>
    logger.tagged(
      [
        { style: KIND_STYLES[kind], text: kind },
        { style: "font-weight: bold", text: name },
      ],
      payload
    )
}
