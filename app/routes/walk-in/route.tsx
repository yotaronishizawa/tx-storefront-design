import { useEffect, useRef, useState } from "react"

import { useTranslation } from "react-i18next"
import { useNavigate, useSearchParams } from "react-router"

import { getRobotStatus, getWorkflowRequests } from "~/api/opm"
import {
  ROBOT_MOVING_KINDS,
  ROBOT_STATUS_LABELS,
} from "~/components/robot/robot-status-label"
import { ROUTES } from "~/config/routes"
import { readAppShellState, useBusyAction } from "~/domains/app-shell"
import {
  readOperationsState,
  resumeRobotUnlessHeld,
  runBusy,
  useManualReplenishmentRequest,
  useRestockRequest,
} from "~/domains/operations"
import {
  beginRobotStopWatch,
  endRobotStopWatch,
  failRobotStopWatch,
  readRobotState,
  useAutoPnpOperating,
  useRobotActions,
  useRobotAttention,
  useRobotOperationMode,
  useRobotStatusStale,
  useRobotWorkStatus,
} from "~/domains/robot"
import { readSessionState, useSession } from "~/domains/session"
import {
  readStoreSelectionState,
  selectSelectedStore,
  useSelectedRobotId,
  useSelectedStoreId,
} from "~/domains/store-selection"
import { useOnlineStatus } from "~/hooks/use-online-status"
import { isActiveRequest } from "~/model/request-state"
import {
  getRobotControls,
  getWalkInBlock,
  type WalkInBlock,
} from "~/model/robot-status"
import { pollUntil } from "~/utils/poll"
import { WalkInView } from "~/views/store/walk-in"

import { useRobotArm } from "../_hooks/use-robot-arm"

export default function WalkInPage() {
  const storeId = useSelectedStoreId()
  const robotId = useSelectedRobotId()
  const session = useSession()
  return <WalkInSession key={`${storeId}:${robotId}:${session?.token ?? ""}`} />
}

const STOP_WAIT_POLLS = 300

const WALK_IN_BLOCK_KEYS = {
  connection: "workflow.walkIn.notConfirmed",
  operator: "workflow.walkIn.notConfirmedOperator",
  busy: "workflow.walkIn.notConfirmedBusy",
  fault: "workflow.walkIn.notConfirmedFault",
} as const satisfies Record<WalkInBlock, string>

function WalkInSession() {
  const { t } = useTranslation("app")
  const navigate = useNavigate()
  const session = useSession()
  const storeId = useSelectedStoreId()
  const robotId = useSelectedRobotId()
  const busyAction = useBusyAction()
  const workStatus = useRobotWorkStatus()
  const operationMode = useRobotOperationMode()
  const stale = useRobotStatusStale()
  const online = useOnlineStatus()
  const robotOperating = useAutoPnpOperating()
  const restock = useRestockRequest()
  const manual = useManualReplenishmentRequest()
  const actions = useRobotActions()
  const arm = useRobotArm()
  const [searchParams] = useSearchParams()
  const attention = useRobotAttention()
  const [confirmed, setConfirmed] = useState(false)
  const [checking, setChecking] = useState(false)
  // Where the stop has got to, for the stopping screen: the request going
  // out, then the robot travelling to its rest position. No time is shown:
  // how long the travel takes depends on where on the rail the robot is.
  const [stopPhase, setStopPhase] = useState<"sending" | "moving">("sending")
  const inFlight = useRef(false)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const blockingTask = isActiveRequest(restock)
    ? "restock"
    : isActiveRequest(manual)
      ? "manual"
      : ""
  const controls = getRobotControls({
    hasRobot: Boolean(robotId),
    workStatus,
    operationMode,
    isOnline: online,
    statusStale: stale,
    robotOperating,
    sessionInProgress: Boolean(blockingTask),
  })
  const ready =
    confirmed &&
    online &&
    !stale &&
    workStatus === "RestPosition" &&
    !blockingTask

  function current() {
    return (
      mounted.current &&
      readStoreSelectionState().selectedStoreId === storeId &&
      selectSelectedStore(readStoreSelectionState())?.robotId === robotId &&
      readSessionState().session?.token === session?.token
    )
  }

  function workflowIsOpen() {
    return readOperationsState().requests.some(
      (request) =>
        isActiveRequest(request) &&
        (request.requestType === "Restock" ||
          request.requestType === "ManualReplenishment")
    )
  }

  async function refreshBeforeCommand() {
    return await runBusy("refresh", async () => {
      if (!(await refreshWorkflowRequests())) return false
      if (workflowIsOpen()) {
        readAppShellState().setError(t("workflow.walkIn.workOpenHint"))
        return false
      }
      return true
    })
  }

  async function refreshWorkflowRequests() {
    if (!session || !current()) return false
    const requests = await getWorkflowRequests(storeId, session.token)
    if (!current()) return false
    readOperationsState().setRequests(requests)
    return true
  }

  async function readFreshRobot() {
    if (!session || !current()) return undefined
    const robot = await getRobotStatus(robotId, session.token)
    if (!current()) return undefined
    if (!robot) throw new Error(t("workflow.walkIn.notConfirmed"))
    readRobotState().setRobot(robot)
    readRobotState().setStatusStale(false)
    return robot
  }

  async function prepare() {
    if (
      inFlight.current ||
      busyAction ||
      !session ||
      !robotId ||
      blockingTask ||
      !online
    )
      return
    inFlight.current = true
    setChecking(true)
    setStopPhase("sending")
    setConfirmed(false)
    try {
      if (!(await refreshBeforeCommand()) || !current()) return
      const robot = await runBusy("refresh", readFreshRobot)
      if (!robot || !current()) return
      const freshStatus = robot.status ?? ""
      const freshControls = getRobotControls({
        hasRobot: true,
        workStatus: freshStatus,
        operationMode: robot.opMode ?? "",
        isOnline: true,
        statusStale: false,
        robotOperating: false,
        sessionInProgress: false,
      })
      // Parked is not enough: until the store has stopped it, the robot can
      // move again on its own (a detection that clears, the next job), so a
      // parked robot not yet stopped by the store is stopped too.
      if (freshStatus !== "RestPosition" || freshControls.canStop) {
        if (!freshControls.canStop) {
          readAppShellState().setError(
            t(WALK_IN_BLOCK_KEYS[getWalkInBlock(freshControls.kind, true)])
          )
          return
        }
        // A moving robot travels to the stop position: the shared popup
        // shows it, as for restocking and manual start. Quiet stop, so no
        // "check it stopped" popup on top.
        const travels = freshStatus !== "RestPosition"
        if (travels) beginRobotStopWatch({ shelves: false })
        if (!(await actions.stopAutoPnpOperation(true)) || !current()) {
          if (travels) endRobotStopWatch()
          return
        }
      }
      setStopPhase("moving")
      const parked = await runBusy("refresh", async () => {
        const result = await pollUntil(
          async () => {
            if (!current()) return true
            const nextRobot = await readFreshRobot()
            return nextRobot?.status === "RestPosition"
          },
          // OPM itself waits up to five minutes for the rest position.
          { retries: STOP_WAIT_POLLS, intervalMs: 1000 }
        )
        if (!current()) return false
        // Never parked: the popup says so (do not go in, call).
        if (!result) {
          failRobotStopWatch()
          return false
        }
        return (await refreshWorkflowRequests()) && !workflowIsOpen()
      })
      if (parked && current()) setConfirmed(true)
    } finally {
      inFlight.current = false
      if (mounted.current) setChecking(false)
    }
  }

  async function handBack() {
    if (inFlight.current || busyAction || !ready) return
    inFlight.current = true
    try {
      // The robot moves again once this goes through: have staff check
      // nobody and nothing is left inside first.
      const choice = await readAppShellState().askOperator({
        buttons: "start-and-home",
        home: false,
        message: t("workflow.walkIn.leaveConfirm"),
      })
      if (choice !== "confirm" || !current()) return
      if (!(await refreshBeforeCommand()) || !current()) return
      const robot = await runBusy("refresh", readFreshRobot)
      if (!robot || !current()) return
      if (robot.status !== "RestPosition") {
        setConfirmed(false)
        readAppShellState().setError(t("workflow.walkIn.notConfirmed"))
        return
      }
      // Retry quietly; if the robot still will not resume, Home shows why
      // in the "needs attention" panel, so go there either way.
      await runBusy("start-auto-pnp", () => resumeRobotUnlessHeld())
      if (current()) {
        readAppShellState().setNotice("")
        void navigate(ROUTES.home().pathname)
      }
    } finally {
      inFlight.current = false
    }
  }

  // Home asked "the robot stops, all right?" before coming here, so a visit
  // from Home (`?start=1`) starts stopping the robot at once.
  const startOnOpen = searchParams.get("start") === "1"
  const started = useRef(false)
  useEffect(() => {
    if (!startOnOpen || started.current) return
    started.current = true
    void prepare()
    // Once, on arrival; prepare reads everything it needs fresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startOnOpen])

  const reachable = online && !stale && Boolean(robotId)
  return (
    <WalkInView
      ready={ready}
      checking={checking}
      busy={Boolean(busyAction)}
      canPrepare={
        online &&
        !stale &&
        Boolean(robotId) &&
        (controls.canStop || workStatus === "RestPosition")
      }
      notReadyReason={t(
        WALK_IN_BLOCK_KEYS[
          getWalkInBlock(controls.kind, online && !stale && Boolean(robotId))
        ]
      )}
      blockingTask={blockingTask}
      statusLabel={t(
        reachable || controls.kind === "noRobot"
          ? ROBOT_STATUS_LABELS[controls.kind]
          : ROBOT_STATUS_LABELS.unknown
      )}
      robotMoving={reachable && ROBOT_MOVING_KINDS.has(controls.kind)}
      stopping={{
        phase: stopPhase,
        statusLost: !reachable,
        hold:
          attention?.cause && attention.cause !== "teleopFixable"
            ? t(`workflow.home.cause.${attention.cause}`)
            : "",
      }}
      arm={{ ...arm, enabled: arm.enabled && ready }}
      onPrepare={() => {
        void prepare()
      }}
      onHandBack={() => {
        void handBack()
      }}
      onReturnToTask={() => {
        void navigate(
          blockingTask === "restock"
            ? ROUTES.restocking().pathname
            : ROUTES.manual().pathname
        )
      }}
    />
  )
}
