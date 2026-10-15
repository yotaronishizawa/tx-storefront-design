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
  wide = false,
}: {
  kind: RobotStatusKind
  available: boolean
  /** Detector and e-stop state; `undefined` until the app reads it from OPM. */
  attention?: RobotAttention
  /**
   * The idle screen has the whole width: the robot large beside the detectors,
   * which then also say their state in words. Home's narrow column keeps one
   * row of detectors in colour only, the robot below.
   */
  wide?: boolean
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
  const detectors: DetectorItem[] = [
    ...DETECTOR_ROWS.map(({ detector, key, Icon }): DetectorItem => {
      const found = attention?.detected?.[detector]
      return {
        key: key,
        Icon,
        label: t(key),
        state: found === undefined ? "unknown" : found ? "alert" : "ok",
        value: t(
          found === undefined
            ? "workflow.home.v5.notReceived"
            : found
              ? "workflow.home.detect.found"
              : "workflow.home.detect.clear"
        ),
      }
    }),
    {
      key: "eStop",
      Icon: OctagonX,
      label: t("workflow.home.eStop"),
      state: eStopState(attention?.eStop),
      value: t(
        !attention?.eStop || attention.eStop === "unknown"
          ? "workflow.home.v5.notReceived"
          : `workflow.home.eStop.${attention.eStop}`
      ),
    },
  ]
  const robotVideo = (
    // Same split as the status pill: working, in trouble, or resting.
    // Transparent clips: HEVC with alpha for Safari/iPad (listed first,
    // since Chrome skips QuickTime), VP9 with alpha for Chrome.
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
  )
  const pill = (
    <p
      role="status"
      className={cn(
        "rounded-full font-bold",
        // Read from across the walk-in on the idle screen: 48 px there.
        wide ? "px-7 py-3 text-display-lg" : "px-4 py-2 text-xl/tight",
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
  )
  return (
    <aside className="flex min-h-0 min-w-0 flex-col bg-subtle p-4 lg:p-5">
      {!wide && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-secondary lg:text-base">
            {t("robotStatus")}
          </h2>
          {pill}
        </div>
      )}
      <p
        className={cn(
          "mt-3 text-xs text-secondary lg:hidden",
          wide && "hidden"
        )}
      >
        {t("workflow.home.v5.detectorsSummary")}
      </p>
      {wide ? (
        // The idle screen only runs on the store iPad: no narrow fallback.
        <div className="mt-2 flex min-h-0 flex-1 justify-center">
          {/* The pill sits over the robot's column, its left edge where the
              working robot reaches furthest left in its clip (2.8% in from
              the clip's edge), so the eye runs down one line. */}
          <div className="grid h-full min-h-0 grid-cols-[auto_24rem] grid-rows-[auto_minmax(0,1fr)] gap-x-12 gap-y-4">
            <div className="ml-[2.8%] place-self-start">{pill}</div>
            <div aria-hidden="true" />
            <div className="min-h-0 overflow-hidden">{robotVideo}</div>
            <section className="grid gap-3 self-center">
              <h2 className="text-lg font-bold text-secondary">
                {t("workflow.idle.safetyCheck")}
              </h2>
              <ul className="grid gap-1 rounded-xl border-2 bg-default p-4">
                {detectors.map(({ key, ...item }) => (
                  <DetectorRow key={key} {...item} wide />
                ))}
              </ul>
            </section>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-4 hidden shrink-0 items-center justify-between gap-4 rounded-xl border-2 bg-default p-4 lg:flex">
            {detectors.map(({ key, ...item }) => (
              <DetectorRow key={key} {...item} />
            ))}
          </div>
          <div className="mt-6 hidden min-h-0 flex-1 flex-col lg:flex">
            <div className="min-h-0 flex-1 overflow-hidden">{robotVideo}</div>
          </div>
        </>
      )}
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

type DetectorState = "unknown" | "ok" | "alert"

function eStopState(eStop: RobotAttention["eStop"] | undefined): DetectorState {
  if (!eStop || eStop === "unknown") return "unknown"
  return eStop === "released" ? "ok" : "alert"
}

type DetectorItem = {
  key: string
  Icon: typeof UserRound
  label: string
  state: DetectorState
  value: string
}

function DetectorRow({
  Icon,
  label,
  state,
  value,
  wide = false,
}: {
  Icon: typeof UserRound
  label: string
  state: DetectorState
  value: string
  /** On the idle screen: a list row that also says the state in words. */
  wide?: boolean
}) {
  // Colour says the state, as on the robot: green clear, red found.
  const tone = cn(
    state === "ok" && "text-success",
    state === "alert" && "bg-error-subtle text-error",
    state === "unknown" && "text-disabled"
  )
  if (wide)
    return (
      <li
        className={cn(
          "flex items-center gap-3 rounded-md p-3 text-xl font-bold",
          tone
        )}
      >
        <span className="size-3 shrink-0 rounded-full bg-current" />
        <Icon className="size-7 shrink-0" />
        <span className="min-w-0 flex-1">{label}</span>
        <span
          className={cn(
            "shrink-0 text-lg",
            state === "ok" && "font-medium text-secondary"
          )}
        >
          {value}
        </span>
      </li>
    )
  return (
    <div
      className={cn(
        "-mx-1.5 flex shrink-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-sm font-bold whitespace-nowrap",
        tone
      )}
    >
      <span className="size-2.5 shrink-0 rounded-full bg-current" />
      <Icon className="size-5 shrink-0" />
      {label}
    </div>
  )
}
