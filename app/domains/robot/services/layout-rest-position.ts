import { getRobotStatus, goToRestPosition } from "~/api/opm"
import type { Robot } from "~/api/opm/schemas"
import { translate } from "~/initializer/i18n"
import { OperatorNotice } from "~/utils/error-message"
import { pollUntil } from "~/utils/poll"

const REST_POSITION_CONFIRM_RETRIES = 12
const REST_POSITION_CONFIRM_INTERVAL_MS = 1000

export async function ensureRobotRestPositionForLayout({
  onRobot,
  robotId,
  token,
}: {
  onRobot: (robot: Robot | null) => void
  robotId: string
  token: string
}) {
  const robot = await getRobotStatus(robotId, token)
  onRobot(robot)

  const workStatus = robot?.status ?? ""
  if (workStatus === "RestPosition") {
    return
  }

  if (workStatus !== "Standby" && workStatus !== "MovingToRestPosition") {
    return
  }

  if (workStatus !== "MovingToRestPosition") {
    await goToRestPosition(robotId, token)
  }

  const confirmed = await waitForRobotRestPosition({
    onRobot,
    robotId,
    token,
  })
  if (!confirmed) {
    throw new OperatorNotice(translate("workflow.layout.robotNotReady"))
  }
}

function waitForRobotRestPosition({
  onRobot,
  robotId,
  token,
}: {
  onRobot: (robot: Robot | null) => void
  robotId: string
  token: string
}) {
  return pollUntil(
    async () => {
      const robot = await getRobotStatus(robotId, token)
      onRobot(robot)
      return robot?.status === "RestPosition"
    },
    {
      retries: REST_POSITION_CONFIRM_RETRIES,
      intervalMs: REST_POSITION_CONFIRM_INTERVAL_MS,
    }
  )
}
