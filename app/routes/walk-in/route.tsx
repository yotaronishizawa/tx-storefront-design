import { useEffect, useRef, useState } from "react"

import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"

import { getRobotStatus, getWorkflowRequests } from "~/api/opm"
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
  readRobotState,
  useAutoPnpOperating,
  useRobotActions,
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

import { useWorkflowRobotPosition } from "../_hooks/use-workflow-robot-position"

export default function WalkInPage() {
  const storeId = useSelectedStoreId()
  const robotId = useSelectedRobotId()
  const session = useSession()
  return <WalkInSession key={`${storeId}:${robotId}:${session?.token ?? ""}`} />
}

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
  const position = useWorkflowRobotPosition()
  const [confirmed, setConfirmed] = useState(false)
  const [checking, setChecking] = useState(false)
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
    setConfirmed(false)
    try {
      if (!(await refreshBeforeCommand()) || !current()) return
      const robot = await runBusy("refresh", readFreshRobot)
      if (!robot || !current()) return
      const freshStatus = robot.status ?? ""
      if (freshStatus !== "RestPosition") {
        const freshControls = getRobotControls({
          hasRobot: true,
          workStatus: freshStatus,
          operationMode: robot.opMode ?? "",
          isOnline: true,
          statusStale: false,
          robotOperating: false,
          sessionInProgress: false,
        })
        if (!freshControls.canStop) {
          readAppShellState().setError(
            t(WALK_IN_BLOCK_KEYS[getWalkInBlock(freshControls.kind, true)])
          )
          return
        }
        if (!(await actions.stopAutoPnpOperation()) || !current()) return
      }
      const parked = await runBusy("refresh", async () => {
        const result = await pollUntil(
          async () => {
            if (!current()) return true
            const nextRobot = await readFreshRobot()
            return nextRobot?.status === "RestPosition"
          },
          { retries: 12, intervalMs: 1000 }
        )
        if (!current()) return false
        if (!result) throw new Error(t("workflow.walkIn.notConfirmed"))
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
      position={{ ...position, enabled: position.enabled && ready }}
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
