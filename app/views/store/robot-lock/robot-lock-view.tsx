import { Wrench } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { RobotLock } from "~/model/robot-status"

const LOCK_MESSAGE_KEY = {
  maintenance: "robotLockMaintenance",
  repair: "robotLockRepair",
  teleoperation: "robotLockTeleoperation",
} as const

/**
 * Covers the whole app while OPM has the robot in maintenance or repair; lifts
 * by itself once the mode changes.
 */
export function RobotLockView({ lock }: { lock: RobotLock }) {
  const { t } = useTranslation("app")

  if (!lock) {
    return null
  }

  return (
    <div
      aria-live="assertive"
      className="fixed inset-0 z-65 grid place-items-center bg-inverse/90 p-6"
      role="alert"
    >
      <div className="flex flex-col items-center gap-4 text-center text-inverse">
        <Wrench aria-hidden className="size-16" />
        <p className="text-xl font-bold whitespace-pre-line">
          {t(LOCK_MESSAGE_KEY[lock])}
        </p>
      </div>
    </div>
  )
}
