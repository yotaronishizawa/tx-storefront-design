import { readAppShellState } from "~/domains/app-shell"
import type { BusyTask, StoreAction } from "~/types/busy-action"

import { actionErrorMessage, reportThrown } from "./action-results"

/**
 * Marks `action` busy and clears the banner while `task` runs; a throw becomes the error banner
 * and is reported.
 * Resolves to the task's result, or `undefined` when it threw.
 */
export async function runBusy<T>(
  action: StoreAction | BusyTask,
  task: () => Promise<T>,
  { formatError = actionErrorMessage } = {}
): Promise<T | undefined> {
  const shell = readAppShellState()
  shell.setBusyAction(action)
  shell.setNotice("")
  shell.setError("")
  try {
    return await task()
  } catch (caught) {
    reportThrown(action, caught)
    shell.setError(formatError(caught))
    return undefined
  } finally {
    readAppShellState().setBusyAction("")
  }
}
