import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"

import { ROUTES } from "~/config/routes"
import {
  readAppShellState,
  useActiveDialog,
  useAppShellStore,
  useBusyAction,
} from "~/domains/app-shell"
import {
  findRestartBlocker,
  readOperationsState,
  runBusy,
  useManualReplenishmentRequest,
  useRestockRequest,
} from "~/domains/operations"
import {
  useAutoPnpOperating,
  useRobotActions,
  useRobotOperationMode,
  useRobotStatusStale,
  useRobotWorkStatus,
} from "~/domains/robot"
import { useSelectedRobotId } from "~/domains/store-selection"
import { useOnlineStatus } from "~/hooks/use-online-status"
import { isActiveRequest } from "~/model/request-state"
import { getRobotControls, getRobotPowerAction } from "~/model/robot-status"
import { RobotPowerDialog } from "~/views/store/robot-power-dialog"

/**
 * The header robot popup: stop or start the robot outside the walk-in work
 * (planned power outages, renovation, a robot left waiting to boot). The
 * button always shows; why it cannot be done is told once it is pressed.
 */
export function RobotPowerHost() {
  const { t } = useTranslation("app")
  const navigate = useNavigate()
  const open = useActiveDialog() === "robot-power"
  const closeDialog = useAppShellStore((state) => state.closeDialog)
  const busy = Boolean(useBusyAction())
  const robotId = useSelectedRobotId()
  const workStatus = useRobotWorkStatus()
  const operationMode = useRobotOperationMode()
  const stale = useRobotStatusStale()
  const online = useOnlineStatus()
  const robotOperating = useAutoPnpOperating()
  const restock = isActiveRequest(useRestockRequest())
  const manual = isActiveRequest(useManualReplenishmentRequest())
  const robotActions = useRobotActions()

  const available = online && !stale && Boolean(robotId)
  const { kind } = getRobotControls({
    hasRobot: Boolean(robotId),
    workStatus,
    operationMode,
    isOnline: online,
    statusStale: stale,
    robotOperating,
    sessionInProgress: false,
  })
  const action = getRobotPowerAction(kind)

  async function start() {
    if (kind === "notStarted") {
      // Boots the robot software, after the shelf check.
      await robotActions.startRobot()
      return
    }
    if (kind === "movingToRest") {
      readAppShellState().setError(t("workflow.robotPower.movingToRest"))
      return
    }
    if (kind !== "atRest") {
      readAppShellState().setError(t("workflow.robotPower.operatorHandling"))
      return
    }
    // As when staff hand the robot back: hold the start while a detector
    // sees something, and let Home's "needs attention" say what.
    const blocker = await runBusy("refresh", findRestartBlocker)
    if (blocker) {
      readOperationsState().setRestartHeldBy(blocker)
      void navigate(ROUTES.home().pathname)
      return
    }
    await robotActions.startRobot()
  }

  async function onAction() {
    closeDialog("robot-power")
    const shell = readAppShellState()
    if (!available) {
      shell.setError(t("workflow.robotPower.unavailable"))
      return
    }
    if (restock) {
      await shell.askOperator({
        buttons: "to-restocking-or-close",
        home: false,
        message: t("workflow.robotPower.restockOpen"),
      })
      return
    }
    if (manual) {
      shell.setError(t("workflow.robotPower.manualOpen"))
      return
    }
    if (action === "stop") {
      await robotActions.stopRobot()
      return
    }
    await start()
  }

  return (
    <RobotPowerDialog
      open={open}
      kind={kind}
      available={available}
      action={action}
      busy={busy}
      onAction={() => void onAction()}
      onClose={() => closeDialog("robot-power")}
    />
  )
}
