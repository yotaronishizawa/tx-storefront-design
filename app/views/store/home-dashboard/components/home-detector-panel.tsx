import type { ParseKeys } from "i18next"
import { Box, TriangleAlert, UserRound, type LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { RobotLiveCamera } from "~/api/opm/schemas"
import { Button, Notice } from "~/core"
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
}

/**
 * A detector holds the robot. One screen whether it stopped mid-work or the
 * app's own restart found it, so the words say what happened and what to do,
 * not which of the two led here.
 */
export function HomeDetectorPanel({
  detector,
  retryState,
  onRetry,
  holdPhase,
  cameras,
  busy,
}: {
  detector: RobotDetector
  /** The robot is held for staff to restart: offer "Try again". */
  retryable: boolean
  retryState: "idle" | "checking" | "still"
  onRetry: () => void
  holdPhase: "holding" | "held" | null
  /** Unused: staff no longer stop the robot before going in (Yotaro 2026-11-12). */
  onHoldForWalkIn?: () => void
  cameras: RobotLiveCamera[]
  busy: boolean
}) {
  const { t } = useTranslation("app")
  const copy = DETECTOR_COPY[detector]

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
        // Always "Try again": staff remove the obstacle first, and while
        // they are inside the human detector keeps the robot still, so it
        // need not be stopped before going in (Yotaro 2026-11-12).
        <div className="flex flex-col gap-3">
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
          {/* The same caption as under the robot arm buttons: a warning mark
              and grey words tied to the button above. 18px, not that one's
              14px, as new screens use. */}
          <p className="flex gap-2 text-lg text-secondary">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-primary-text" />
            {t(
              detector === "human"
                ? "workflow.home.attention.retryHintHuman"
                : "workflow.home.attention.retryHintObstacle"
            )}
          </p>
        </div>
      }
    >
      {holdPhase !== null && retryState === "idle" && (
        <Notice tone={holdPhase === "holding" ? "error" : "neutral"}>
          {t(
            holdPhase === "holding"
              ? "workflow.home.attention.holding"
              : "workflow.home.attention.held"
          )}
        </Notice>
      )}
      {retryState !== "idle" && (
        <Notice tone={retryState === "still" ? "error" : "neutral"}>
          {t(
            retryState === "still"
              ? detector === "human"
                ? "workflow.home.attention.retryStillHuman"
                : "workflow.home.attention.retryStill"
              : "workflow.home.attention.retryChecking"
          )}
        </Notice>
      )}
    </AttentionLayout>
  )
}
