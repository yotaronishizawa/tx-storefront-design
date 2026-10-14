/*
 * What operators and the store send each other outside requests: store
 * notifications, store tasks, and operator tasks (a store asking the
 * operations centre to act, e.g. park the robot). OPM keeps all three per
 * store (`TaskUsecase`).
 */
import { state } from "../state.mjs"
import { randomUUID } from "../utils/id.mjs"
import { unixSeconds } from "../utils/time.mjs"

// `UserTaskType` (`Operation/Entities/UserTaskContext.cs`).
const USER_TASK_TYPE = { store: 0, operator: 1 }

export const taskMethods = {
  GetNotifications: () => state.notifications,
  // Upserts by `id`, filling `id` and `timestamp` when missing. Answers nothing.
  SetNotification: ([, notification]) => {
    upsert(state.notifications, withIdentity(notification))
    return null
  },

  // `GetRequestedTasks(storeId, userTaskType)`: the store's tasks of one type.
  GetRequestedTasks: ([, userTaskType]) =>
    Number(userTaskType ?? USER_TASK_TYPE.store) === USER_TASK_TYPE.operator
      ? state.operatorTasks
      : state.storeTasks,
  // Answers the stored task. OPM cannot read this argument over SignalR today:
  // `UserTaskContext` is abstract and has no JSON converter.
  SetUserTask: ([storeId, task]) => {
    const stored = {
      ...withIdentity(task),
      storeId: String(storeId ?? ""),
      taskType: USER_TASK_TYPE.store,
    }
    upsert(state.storeTasks, stored)
    return stored
  },

  GetRequestedOperatorTasks: () => state.operatorTasks,
  // Answers nothing; OPM also posts the task to Slack.
  SetOperatorTask: ([storeId, task]) => {
    upsert(state.operatorTasks, {
      ...withIdentity(task),
      storeId: String(storeId ?? ""),
      taskType: USER_TASK_TYPE.operator,
    })
    return null
  },
}

/** `id` and `timestamp` (Unix seconds) as OPM fills them when the sender left them out. */
function withIdentity(item) {
  return {
    ...item,
    id: item?.id || randomUUID(),
    timestamp: item?.timestamp || unixSeconds(),
  }
}

function upsert(list, item) {
  const index = list.findIndex((existing) => existing.id === item.id)
  if (index === -1) {
    list.push(item)
  } else {
    list[index] = item
  }
}
