import { useEffect } from "react"

import { readAppShellState } from "~/domains/app-shell"
import { getRobotLock } from "~/model/robot-status"

import { useRobotOperationMode, useRobotWorkStatus } from "../use-robot"

/** Background prompts wait while the maintenance/repair lock is up. */
export function useRobotLockOverlayReport() {
  const operationMode = useRobotOperationMode()
  const workStatus = useRobotWorkStatus()
  const locked = getRobotLock(operationMode, workStatus) !== ""

  useEffect(() => {
    readAppShellState().setOverlayShowing("robot-lock", locked)
    return () => readAppShellState().setOverlayShowing("robot-lock", false)
  }, [locked])
}
