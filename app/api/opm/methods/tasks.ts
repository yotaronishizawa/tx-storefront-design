import {
  OperatorTaskName,
  StoreNotificationNotiType,
  UserTaskStatus,
  UserTaskType,
  type OperatorTaskNameName,
} from "../__generated__/opm-rpc"
import { call } from "../client"
import { readStoreNotifications, type StoreNotification } from "../schemas"

/** Asks the operations centre to act for the store; OPM answers nothing. */
export async function requestOperatorTask(
  storeId: string,
  task: { name: OperatorTaskNameName; title: string; description: string },
  token: string
): Promise<void> {
  await call(
    "SetOperatorTask",
    [
      storeId,
      {
        storeId,
        taskName: OperatorTaskName[task.name],
        auxData: null,
        id: null,
        title: task.title,
        description: task.description,
        status: UserTaskStatus.NotStarted,
        timestamp: Math.floor(Date.now() / 1000),
        taskType: UserTaskType.Operator,
      },
    ],
    token
  )
}

export async function getStoreNotifications(storeId: string, token: string) {
  return readStoreNotifications(
    await call("GetNotifications", [storeId], token)
  )
}

/** OPM upserts by id, so the notification goes back whole with `isChecked` set. */
export async function markNotificationChecked(
  storeId: string,
  notification: StoreNotification,
  token: string
): Promise<void> {
  await call(
    "SetNotification",
    [
      storeId,
      {
        ...notification,
        isChecked: true,
        type: StoreNotificationNotiType[notification.type ?? "Default"],
      },
    ],
    token
  )
}
