/*
 * What the operations centre sends a store: a notification, or a store task.
 * Nothing in the store creates these, so they come from here.
 */
import { state } from "../state.mjs"
import { randomUUID } from "../utils/id.mjs"
import { readIntParam } from "../utils/params.mjs"
import { unixSeconds } from "../utils/time.mjs"
import { post } from "./route.mjs"

export const taskRoutes = [
  // `StoreNotification.NotiType`: 0 Default, 1 RefillStock, 2 ChangeDisplayLayout.
  post("/sim/notification", (params) => {
    const notification = {
      id: randomUUID(),
      title: params.get("title") || "Refill the stock shelf",
      description: params.get("description") || "",
      timestamp: unixSeconds(),
      isChecked: false,
      type: readIntParam(params, "type", 0),
    }
    state.notifications.push(notification)
    return { ok: true, notification }
  }),
  // `UserTaskStatus`: 0 NotStarted … 3 Completed, 6 Cancelled.
  post("/sim/store-task", (params) => {
    const task = {
      id: randomUUID(),
      title: params.get("title") || "Clean the display shelf",
      description: params.get("description") || "",
      status: readIntParam(params, "status", 0),
      timestamp: unixSeconds(),
      taskType: 0,
      storeId: state.robot.storeId,
    }
    state.storeTasks.push(task)
    return { ok: true, task }
  }),
]
