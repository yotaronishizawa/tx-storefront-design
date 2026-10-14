import { useEffect, useState } from "react"

import {
  getRobotDetection,
  getRobotDetectionWithCameras,
  getTeleoperationErrorCode,
} from "~/api/opm"
import type {
  RobotLiveCamera,
  RobotLiveDetection,
  TeleopErrorCodeName,
} from "~/api/opm/schemas"
import {
  readOperationsState,
  useRobotRestartedAt,
  useRobotRestartHeldBy,
  useRobotResumeFailure,
} from "~/domains/operations"
import { useSession } from "~/domains/session"
import { useSelectedRobotId } from "~/domains/store-selection"
import {
  CAMERA_CAUSES,
  TELEOP_REQUEST_STATUSES,
  toRobotAttention,
  type RobotAttention,
} from "~/model/robot-attention"

import { useRobotStatusStale, useRobotWorkStatus } from "../use-robot"

// Provisional: polling RobotLiveData is new for the store app; agree the
// rates (and whether OPM should push instead) with the OPM team.
const DETECTION_POLL_MS = 3_000
const CAMERA_POLL_MS = 10_000
const TELEOP_CODE_POLL_MS = 10_000
// A detector stop this soon after the app restarted the robot is the restart
// being held up (staff still inside, something left behind). Provisional.
const RESTART_HOLD_WINDOW_MS = 5 * 60_000

/**
 * What the robot needs from store staff, polled while mounted (home only):
 * detectors, stop reason and e-stop from RobotLiveData, plus the work status
 * the app already polls, the teleoperation error while one is requested, and
 * the app's own failed restart. Camera frames are fetched only while a
 * detector cause shows. `undefined` without a robot or before anything is known.
 */
export function useRobotAttention(): RobotAttention | undefined {
  const session = useSession()
  const robotId = useSelectedRobotId()
  const workStatus = useRobotWorkStatus()
  const statusStale = useRobotStatusStale()
  const resumeFailure = useRobotResumeFailure()
  const restartedAt = useRobotRestartedAt()
  const restartHeldBy = useRobotRestartHeldBy()
  const [justRestarted, setJustRestarted] = useState(false)
  const [live, setLive] = useState<{
    robotId: string
    detection: RobotLiveDetection
  }>()
  const [teleopError, setTeleopError] = useState<TeleopErrorCodeName | null>(
    null
  )
  const [cameras, setCameras] = useState<RobotLiveCamera[]>([])
  const token = session?.token
  const current = live && live.robotId === robotId ? live.detection : undefined
  const status = robotId && !statusStale && workStatus ? workStatus : undefined
  const requestingTeleop = TELEOP_REQUEST_STATUSES.has(status)

  useEffect(() => {
    if (!token || !robotId) return
    let cancelled = false
    async function poll() {
      try {
        const detection = await getRobotDetection(robotId, token!)
        if (!cancelled) setLive({ robotId, detection })
      } catch {
        // Keep the last answer; the next poll retries.
      }
    }
    void poll()
    const timer = window.setInterval(() => void poll(), DETECTION_POLL_MS)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [robotId, token])

  // Why the robot asks for an operator; an unreadable code reads as "None".
  useEffect(() => {
    if (!requestingTeleop || !token || !robotId) return
    let cancelled = false
    async function poll() {
      try {
        const code = await getTeleoperationErrorCode(robotId, token!)
        if (!cancelled) setTeleopError(code)
      } catch {
        // Keep the last answer; the next poll retries.
      }
    }
    void poll()
    const timer = window.setInterval(() => void poll(), TELEOP_CODE_POLL_MS)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [requestingTeleop, robotId, token])

  useEffect(() => {
    if (restartedAt === null) return
    const left = restartedAt + RESTART_HOLD_WINDOW_MS - Date.now()
    setJustRestarted(left > 0)
    if (left <= 0) return
    const timer = window.setTimeout(() => setJustRestarted(false), left)
    return () => window.clearTimeout(timer)
  }, [restartedAt])

  // A failed restart is over once the robot works again, whoever restarted it.
  useEffect(() => {
    if (
      (resumeFailure || restartHeldBy) &&
      status &&
      status !== "RestPosition" &&
      status !== "MovingToRestPosition"
    ) {
      readOperationsState().setResumeFailure(null)
      readOperationsState().setRestartHeldBy(null)
    }
  }, [resumeFailure, restartHeldBy, status])

  const attention =
    current || status
      ? toRobotAttention(current, {
          status,
          teleopError: requestingTeleop ? teleopError : null,
          resumeFailed: resumeFailure !== null,
          justRestarted,
          restartHeldBy,
        })
      : undefined
  const showsCameras = !!attention?.cause && CAMERA_CAUSES.has(attention.cause)

  useEffect(() => {
    if (!showsCameras || !token || !robotId) return
    let cancelled = false
    async function poll() {
      try {
        const detection = await getRobotDetectionWithCameras(robotId, token!)
        if (!cancelled) setCameras(detection.cameras)
      } catch {
        // Keep the last frames; the next poll retries.
      }
    }
    void poll()
    const timer = window.setInterval(() => void poll(), CAMERA_POLL_MS)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [showsCameras, robotId, token])

  return attention && { ...attention, cameras: showsCameras ? cameras : [] }
}
