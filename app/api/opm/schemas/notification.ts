import { z } from "zod"

import { StoreNotificationNotiType } from "../__generated__/opm-rpc"
import { count, enumName, flag, list, text } from "../../shared/fields"

const storeNotificationSchema = z.looseObject({
  id: z.string(),
  description: text,
  isChecked: flag,
  // Unix seconds.
  timestamp: count,
  type: enumName(StoreNotificationNotiType),
})

export type StoreNotification = z.output<typeof storeNotificationSchema>

/** `GetNotifications`: everything OPM holds for the store, checked or not. */
export function readStoreNotifications(value: unknown): StoreNotification[] {
  return list(storeNotificationSchema, "store notifications").parse(value)
}
