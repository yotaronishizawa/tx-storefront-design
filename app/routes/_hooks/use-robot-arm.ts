import { useEffect, useState } from "react"

import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router"

import { getRobotDetection } from "~/api/opm"
import type {
  RobotArmControlProps,
  RobotArmTarget,
} from "~/components/robot/robot-arm-control"
import {
  readAppShellState,
  useActionPrompt,
  useActiveDialog,
} from "~/domains/app-shell"
import {
  useRobotActions,
  useRobotStatusStale,
  useRobotWorkStatus,
} from "~/domains/robot"
import { useSession } from "~/domains/session"
import { useSelectedRobotId } from "~/domains/store-selection"
import { useOnlineStatus } from "~/hooks/use-online-status"
import { toRobotArmPosition } from "~/model/robot-arm"

// Read all the while the screen is open, as Home reads the detectors, so the
// card opens on a known position; faster while the arm travels. Provisional.
const ARM_POLL_MS = 3_000
const ARM_MOVING_POLL_MS = 1_000
// Past this the arm is not coming, or its height is not reported: give up
// waiting so the card can close. Provisional.
const ARM_MOVE_TIMEOUT_MS = 60_000

/**
 * The arm card on the restocking and take-out screens. The position comes
 * from the robot's lift joint in `RobotLiveData`; a move asks to confirm the
 * surroundings first, and the card stays open so the arm can be seen travelling.
 */
export function useRobotArm(): RobotArmControlProps {
  const { t } = useTranslation("app")
  const token = useSession()?.token
  const robotId = useSelectedRobotId()
  const workStatus = useRobotWorkStatus()
  const stale = useRobotStatusStale()
  const online = useOnlineStatus()
  const actions = useRobotActions()
  const [open, setOpen] = useState(false)
  // `?arm=open` arrives from the help's shortcut: open the card once, then
  // drop the flag so a reload does not open it again.
  const [searchParams, setSearchParams] = useSearchParams()
  const armParam = searchParams.get("arm")
  // Wait out any notice the screen opens on arrival: tapping it away would
  // also close the card.
  const activeDialog = useActiveDialog()
  const prompt = useActionPrompt()
  useEffect(() => {
    if (armParam !== "open" || activeDialog !== null || prompt !== null) return
    setOpen(true)
    setSearchParams(
      (current) => {
        current.delete("arm")
        return current
      },
      { replace: true }
    )
  }, [activeDialog, armParam, prompt, setSearchParams])
  const [moving, setMoving] = useState<RobotArmTarget | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [height, setHeight] = useState<{
    robotId: string
    value: number | null
  }>()

  useEffect(() => {
    if (!token || !robotId) return
    let cancelled = false
    async function read() {
      try {
        const live = await getRobotDetection(robotId, token!)
        if (!cancelled) setHeight({ robotId, value: live.armHeight })
      } catch {
        // Keep the last reading; the next poll retries.
      }
    }
    void read()
    const timer = window.setInterval(
      () => void read(),
      moving ? ARM_MOVING_POLL_MS : ARM_POLL_MS
    )
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [robotId, token, moving])

  const position = toRobotArmPosition(
    height?.robotId === robotId ? height.value : null
  )
  // The move is over once the arm is reported at the end it was sent to.
  useEffect(() => {
    if (moving !== null && position === moving) setMoving(null)
  }, [moving, position])
  useEffect(() => {
    if (moving === null) return
    const timer = window.setTimeout(() => setMoving(null), ARM_MOVE_TIMEOUT_MS)
    return () => window.clearTimeout(timer)
  }, [moving])

  async function onMove(target: RobotArmTarget) {
    setConfirming(true)
    const choice = await readAppShellState().askOperator({
      buttons: "confirmed-cancel",
      home: false,
      message: t("workflow.robotArm.confirm"),
    })
    setConfirming(false)
    if (choice !== "confirm") return
    setMoving(target)
    const sent = await (target === "top"
      ? actions.moveRestPositionTop(true)
      : actions.moveRestPositionBottom(true))
    // A refused move never arrives; the runner has said why.
    if (!sent) setMoving(null)
  }

  return {
    open,
    // A confirm or a running move keeps the card open behind it.
    onOpenChange: (next) => {
      // A notice that pops up over the open card is tapped away; that tap
      // should not close the card too.
      if (next || (!confirming && moving === null && prompt === null))
        setOpen(next)
    },
    position,
    moving,
    enabled:
      online && !stale && Boolean(robotId) && workStatus === "RestPosition",
    onMove: (target) => void onMove(target),
  }
}
