import type { ParseKeys } from "i18next"
import { Box, Milk, UserRound, type LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { RobotLiveCamera } from "~/api/opm/schemas"
import { Button } from "~/core"
import type { RobotDetector } from "~/model/robot-attention"

import { AttentionLayout } from "./attention-layout"

type DetectorCopy = {
  icon: LucideIcon
  title: ParseKeys<"app">
  sub: ParseKeys<"app">
  /** When staff see nothing there: a false detection, so call support. */
  notFound: ParseKeys<"app">
}

/** The same words, icons and support line as the Unity app's detection popup. */
const DETECTOR_COPY: Record<RobotDetector, DetectorCopy> = {
  human: {
    icon: UserRound,
    title: "workflow.home.attention.titleHuman",
    sub: "workflow.home.attention.subHuman",
    notFound: "workflow.home.attention.notFoundHuman",
  },
  obstacle: {
    icon: Box,
    title: "workflow.home.attention.titleObstacle",
    sub: "workflow.home.attention.subObstacle",
    notFound: "workflow.home.attention.notFoundObstacle",
  },
  fallenDrink: {
    icon: Milk,
    title: "workflow.home.attention.titleFallenDrink",
    sub: "workflow.home.attention.subFallenDrink",
    notFound: "workflow.home.attention.notFoundFallenDrink",
  },
}

/**
 * A detector holds the robot. One screen whether it stopped mid-work or the
 * app's own restart found it, so the words say what happened and what to do,
 * not which of the two led here.
 */
export function HomeDetectorPanel({
  detector,
  retryable,
  retryState,
  onRetry,
  holdPhase,
  onHoldForWalkIn,
  cameras,
  busy,
}: {
  detector: RobotDetector
  /** The robot is held for staff to restart: offer "Try again". */
  retryable: boolean
  retryState: "idle" | "checking" | "still"
  onRetry: () => void
  holdPhase: "holding" | "held" | null
  onHoldForWalkIn: () => void
  cameras: RobotLiveCamera[]
  busy: boolean
}) {
  const { t } = useTranslation("app")
  const copy = DETECTOR_COPY[detector]
  // Going in mid-work: only the detection stops the robot, so the store
  // stops it first. A human is already inside, so not for them.
  const offerHold = !retryable && detector !== "human"

  return (
    <AttentionLayout
      icon={copy.icon}
      title={t(copy.title)}
      body={t(copy.sub)}
      support={{
        heading: t(copy.notFound),
        body: t("workflow.home.attention.falseDetection"),
      }}
      camera={{ frames: cameras, showDetectedKey: true }}
      action={
        offerHold ? (
          <Button
            size="lg"
            className="w-full"
            disabled={busy}
            onClick={onHoldForWalkIn}
          >
            {t("workflow.home.enterWalkIn")}
          </Button>
        ) : (
          <Button
            size="lg"
            className="w-full"
            disabled={
              busy || retryState === "checking" || holdPhase === "holding"
            }
            onClick={onRetry}
          >
            {t("workflow.home.attention.actionRetry")}
          </Button>
        )
      }
    >
      {holdPhase !== null && retryState === "idle" && (
        <p
          role="status"
          className={
            holdPhase === "holding"
              ? "rounded-md bg-error-subtle px-4 py-2 text-base font-bold text-error"
              : "rounded-md bg-subtle px-4 py-2 text-base font-bold"
          }
        >
          {t(
            holdPhase === "holding"
              ? "workflow.home.attention.holding"
              : "workflow.home.attention.held"
          )}
        </p>
      )}
      {retryState !== "idle" && (
        <p
          role="status"
          className={
            retryState === "still"
              ? "rounded-md bg-error-subtle px-4 py-2 text-base font-bold text-error"
              : "text-base text-secondary"
          }
        >
          {t(
            retryState === "still"
              ? "workflow.home.attention.retryStill"
              : "workflow.home.attention.retryChecking"
          )}
        </p>
      )}
    </AttentionLayout>
  )
}
