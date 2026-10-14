import { isUnauthorizedError } from "~/api/opm"
import { readAppShellState } from "~/domains/app-shell"
import { translate } from "~/initializer/i18n"
import type { StoreAction } from "~/types/busy-action"
import { AudioCues, playStoreAudio } from "~/utils/audio"

import {
  getActionPrompt,
  getActionSuccessNotice,
  getActionSuccessPrompt,
  isRetryChoice,
  reportActionFailure,
} from "../services/action-results"
import { refreshRequests } from "../services/active-requests"
import { resumeRobotWithRetry } from "../services/robot-resume"
import { runBusy } from "../services/run-busy"
import { attemptStoreAction } from "../services/store-action-retry"

type RunStoreAction = (
  action: StoreAction,
  callback: () => Promise<unknown>,
  options?: { replay?: boolean; successNotice?: boolean }
) => Promise<boolean>

/** Runs one OPM command: busy flag, retries, error popup, request refresh, success sound. */
export function useStoreActionRunner(): RunStoreAction {
  return runStoreAction
}

async function runStoreAction(
  action: StoreAction,
  callback: () => Promise<unknown>,
  {
    replay = true,
    successNotice = true,
  }: { replay?: boolean; successNotice?: boolean } = {}
): Promise<boolean> {
  const shell = readAppShellState()

  for (let failures = 1; ; failures++) {
    const attempt = await runBusy(action, () =>
      attemptStoreAction(action, callback, replay)
    )
    if (!attempt) {
      return false
    }

    if (attempt.ok) {
      // The command landed; a failed refresh is not its failure.
      await refreshRequests().catch(() => undefined)
      if (action === "start-restocking") {
        void playStoreAudio(AudioCues.CanStartRestock)
      }
      const successPrompt = getActionSuccessPrompt(action)
      if (attempt.restartFailure) {
        reportActionFailure(action, attempt.restartFailure)
        // The task closed but OPM could not restart the robot: retry quietly,
        // and only if that fails point staff to the home panel.
        const resumed = await runBusy("start-auto-pnp", resumeRobotWithRetry)
        if (!resumed) {
          await shell.askOperator(
            getActionPrompt(action, attempt.restartFailure, failures)
          )
        }
      } else if (successNotice && successPrompt) {
        await shell.askOperator(successPrompt)
      } else if (successNotice) {
        shell.setNotice(getActionSuccessNotice(action, attempt.result))
      }
      return true
    }

    // The client already tried a token refresh; nothing to retry.
    if (
      attempt.failure.kind === "thrown" &&
      isUnauthorizedError(attempt.failure.cause)
    ) {
      shell.setError(translate("sessionExpired"))
      return false
    }

    reportActionFailure(action, attempt.failure)
    // Outside the busy flag, so the dialog under the popup is usable.
    const prompt = getActionPrompt(action, attempt.failure, failures)
    if (!replay && isRetryChoice(prompt, "confirm")) prompt.buttons = "ok"
    const choice = await shell.askOperator(prompt)
    if (!replay || !isRetryChoice(prompt, choice)) {
      return false
    }
  }
}
