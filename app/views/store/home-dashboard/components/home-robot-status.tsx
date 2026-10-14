import { useEffect, useRef } from "react"

import type { ParseKeys } from "i18next"
import { Ban, Box, OctagonX, UserRound } from "lucide-react"
import { useTranslation } from "react-i18next"

import {
  ROBOT_MOVING_KINDS,
  ROBOT_STATUS_LABELS,
} from "~/components/robot/robot-status-label"
import {
  type RobotAttention,
  type RobotDetector,
} from "~/model/robot-attention"
import type { RobotStatusKind } from "~/model/robot-status"
import { cn } from "~/utils/cn"

export function HomeRobotStatus({
  kind,
  available,
  attention,
}: {
  kind: RobotStatusKind
  available: boolean
  /** Detector and e-stop state; `undefined` until the app reads it from OPM. */
  attention?: RobotAttention
}) {
  const { t } = useTranslation("app")
  const moving = available && ROBOT_MOVING_KINDS.has(kind)
  const cause = attention?.cause ?? null
  const assist = attention?.level === "assist"
  // Faults staff cannot fix rest calmly, like the pill; only a cause looks troubled.
  const robotClip = cause
    ? "trouble"
    : moving || (available && kind === "standby")
      ? "normal"
      : "resting"
  const robotVideoRef = useRef<HTMLVideoElement>(null)
  // Browsers pause autoplay while the page is hidden; resume when the tablet comes back.
  useEffect(() => {
    const resume = () => {
      if (document.visibilityState === "visible")
        void robotVideoRef.current?.play().catch(() => {})
    }
    document.addEventListener("visibilitychange", resume)
    return () => document.removeEventListener("visibilitychange", resume)
  }, [])
  return (
    <aside className="flex min-h-0 min-w-0 flex-col bg-subtle p-4 lg:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-secondary lg:text-base">
          {t("robotStatus")}
        </h2>
        <p
          role="status"
          className={cn(
            "rounded-full px-4 py-2 text-xl/tight font-bold",
            assist
              ? "bg-primary text-on-primary"
              : cause
                ? "attention-blink bg-error text-inverse"
                : moving
                  ? "bg-success text-inverse"
                  : "bg-muted text-primary"
          )}
        >
          {assist
            ? t("workflow.home.assist.badge")
            : cause
              ? t("workflow.home.attention.badge")
              : t(
                  kind === "noRobot" || available
                    ? ROBOT_STATUS_LABELS[kind]
                    : ROBOT_STATUS_LABELS.unknown
                )}
        </p>
      </div>
      <p className="mt-3 text-xs text-secondary lg:hidden">
        {t("workflow.home.v5.detectorsSummary")}
      </p>
      <div className="mt-4 hidden shrink-0 items-center justify-between gap-4 rounded-xl border-2 bg-default p-4 lg:flex">
        {DETECTOR_ROWS.map(({ detector, key, Icon }) => {
          const found = attention?.detected?.[detector]
          return (
            <DetectorRow
              key={key}
              Icon={Icon}
              label={t(key)}
              state={found === undefined ? "unknown" : found ? "alert" : "ok"}
            />
          )
        })}
        <DetectorRow
          Icon={OctagonX}
          label={t("workflow.home.eStop")}
          state={
            !attention?.eStop || attention.eStop === "unknown"
              ? "unknown"
              : attention.eStop === "released"
                ? "ok"
                : "alert"
          }
        />
      </div>
      <div className="mt-6 hidden min-h-0 flex-1 flex-col lg:flex">
        <div className="min-h-0 flex-1 overflow-hidden">
          {/* Same split as the status pill: working, in trouble, or resting.
              Transparent clips: HEVC with alpha for Safari/iPad (listed first,
              since Chrome skips QuickTime), VP9 with alpha for Chrome. */}
          <video
            key={robotClip}
            ref={robotVideoRef}
            aria-hidden="true"
            autoPlay
            loop
            muted
            playsInline
            disablePictureInPicture
            className="pointer-events-none mx-auto h-full w-auto max-w-full object-contain object-bottom"
          >
            <source
              src={`/assets/home-study-2026-10-06/robot-${robotClip}.mov`}
              type='video/quicktime; codecs="hvc1"'
            />
            <source
              src={`/assets/home-study-2026-10-06/robot-${robotClip}.webm`}
              type="video/webm"
            />
          </video>
        </div>
      </div>
    </aside>
  )
}

const DETECTOR_ROWS: {
  detector: RobotDetector
  key: ParseKeys<"app">
  Icon: typeof UserRound
}[] = [
  { detector: "human", key: "workflow.home.v5.person", Icon: UserRound },
  { detector: "obstacle", key: "workflow.home.v5.obstacle", Icon: Ban },
  { detector: "fallenDrink", key: "workflow.home.v5.droppedDrink", Icon: Box },
]

function DetectorRow({
  Icon,
  label,
  state,
}: {
  Icon: typeof UserRound
  label: string
  state: "unknown" | "ok" | "alert"
}) {
  // Colour alone says the state, as on the robot: green clear, red found.
  return (
    <div
      className={cn(
        "-mx-1.5 flex shrink-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-sm font-bold whitespace-nowrap",
        state === "ok" && "text-success",
        state === "alert" && "bg-error-subtle text-error",
        state === "unknown" && "text-disabled"
      )}
    >
      <span className="size-2.5 shrink-0 rounded-full bg-current" />
      <Icon className="size-5 shrink-0" />
      {label}
    </div>
  )
}
