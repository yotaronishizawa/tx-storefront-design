import type { ComponentType, ReactNode } from "react"

import type { ParseKeys } from "i18next"
import {
  Box,
  CircleCheck,
  Minus,
  OctagonX,
  TriangleAlert,
  UserRound,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { RobotClip } from "~/components/robot/robot-clip"
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
   * The idle screen has the whole width: laid out like station signage, the
   * detectors then also saying their state in words. Home's narrow column
   * keeps one row of detectors in colour only, the robot below.
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
    // Transparent clips: one file per browser engine (see robotClipSrc).
    <RobotClip
      clip={robotClip}
      className="pointer-events-none mx-auto h-full w-auto max-w-full object-contain object-bottom"
    />
  )
  const statusLabel = assist
    ? t("workflow.home.assist.badge")
    : cause
      ? t("workflow.home.attention.badge")
      : t(
          kind === "noRobot" || available
            ? ROBOT_STATUS_LABELS[kind]
            : ROBOT_STATUS_LABELS.unknown
        )
  if (wide)
    return (
      <IdleStatusLayout
        tone={assist ? "assist" : cause ? "cause" : moving ? "moving" : "rest"}
        statusLabel={statusLabel}
        robotVideo={robotVideo}
        detectors={detectors}
        heading={t("workflow.idle.safetyCheck")}
      />
    )
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
          {statusLabel}
        </p>
      </div>
      <p className="mt-3 text-xs text-secondary lg:hidden">
        {t("workflow.home.v5.detectorsSummary")}
      </p>
      <div className="mt-4 hidden shrink-0 grid-cols-2 gap-x-4 gap-y-2 rounded-xl border-2 bg-default p-4 lg:grid">
        {detectors.map(({ key, ...item }) => (
          <DetectorRow key={key} {...item} />
        ))}
      </div>
      <div className="mt-6 hidden min-h-0 flex-1 flex-col lg:flex">
        <div className="min-h-0 flex-1 overflow-hidden">{robotVideo}</div>
      </div>
    </aside>
  )
}

const DETECTOR_ROWS: {
  detector: RobotDetector
  key: ParseKeys<"app">
  Icon: DetectorIcon
}[] = [
  { detector: "human", key: "workflow.home.v5.person", Icon: UserRound },
  { detector: "obstacle", key: "workflow.home.v5.obstacle", Icon: Box },
]

type DetectorState = "unknown" | "ok" | "alert"

function eStopState(eStop: RobotAttention["eStop"] | undefined): DetectorState {
  if (!eStop || eStop === "unknown") return "unknown"
  return eStop === "released" ? "ok" : "alert"
}

type DetectorItem = {
  key: string
  Icon: DetectorIcon
  label: string
  state: DetectorState
  value: string
}

function DetectorRow({
  Icon,
  label,
  state,
}: {
  Icon: DetectorIcon
  label: string
  state: DetectorState
}) {
  // Colour says the state, as on the robot: green clear, red found.
  return (
    <div
      className={cn(
        "-mx-1.5 flex shrink-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-sm font-bold whitespace-nowrap",
        state === "ok" && "text-success",
        state === "alert" && "bg-error-subtle text-error",
        state === "unknown" && "text-disabled"
      )}
    >
      <StateMark state={state} className="size-4" />
      <Icon className="size-5 shrink-0" />
      {label}
    </div>
  )
}

type DetectorIcon = ComponentType<{ className?: string }>

/**
 * A check passed, something found, or nothing read yet: a shape as well as
 * a colour, so the state reads without telling green from red.
 */
function StateMark({
  state,
  className,
}: {
  state: DetectorState
  className?: string
}) {
  const Mark =
    state === "ok" ? CircleCheck : state === "alert" ? TriangleAlert : Minus
  return <Mark aria-hidden="true" className={cn("shrink-0", className)} />
}

type StatusTone = "assist" | "cause" | "moving" | "rest"

/**
 * The idle screen's robot status, laid out like station signage: the state as
 * a big headline top left, the checks as a row of tiles under it, the robot
 * standing full height on the right.
 */
function IdleStatusLayout({
  tone,
  statusLabel,
  robotVideo,
  detectors,
  heading,
}: {
  tone: StatusTone
  statusLabel: string
  robotVideo: ReactNode
  detectors: DetectorItem[]
  heading: string
}) {
  const loud = tone === "assist" || tone === "cause"
  const dot = (
    <span
      aria-hidden="true"
      className={cn(
        "shrink-0 rounded-full",
        tone === "moving" ? "bg-success" : "bg-(--text-color-disabled)"
      )}
    />
  )
  return (
    // The whole screen takes the state's tint, so the state reads from
    // across the walk-in before the words do. Red only for a cause.
    <aside
      className={cn(
        "grid min-h-0 flex-1 grid-cols-[auto_minmax(0,1fr)] gap-10 px-14 pt-8 pb-6 transition-colors duration-700",
        // Half the green: the tint is felt, not read. Red stays full.
        tone === "moving" && "bg-success-subtle/50",
        tone === "rest" && "bg-subtle",
        tone === "cause" && "bg-error-subtle",
        tone === "assist" && "bg-primary-subtle"
      )}
    >
      <div className="flex min-h-0 flex-col">
        <p
          role="status"
          className={cn(
            "flex items-center gap-6 self-start text-[4.875rem]/none font-bold tracking-tight",
            loud
              ? cn(
                  "rounded-xl px-8 py-5 text-inverse",
                  tone === "cause"
                    ? "attention-blink bg-error"
                    : "bg-primary text-on-primary"
                )
              : tone === "moving"
                ? "text-success"
                : "text-primary"
          )}
        >
          {!loud && <span className="contents [&>span]:size-9">{dot}</span>}
          {statusLabel}
        </p>
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold tracking-wider text-secondary">
            {heading}
          </h2>
          <ul className="grid grid-cols-[repeat(2,16.5rem)] gap-3">
            {detectors.map(({ key, Icon, label, state, value }) => (
              <li
                key={key}
                className={cn(
                  "flex items-center gap-3.5 rounded-xl p-4",
                  state === "alert"
                    ? "bg-error text-inverse"
                    : "bg-default/85 text-primary",
                  state === "unknown" && "text-disabled"
                )}
              >
                <Icon className="size-9 shrink-0" />
                <span className="grid min-w-0 flex-1 gap-1">
                  <span className="text-[1.625rem]/tight font-bold whitespace-nowrap">
                    {label}
                  </span>
                  {/* The mark sits with the state's words, not on its own
                        at the edge, so the tile stays narrow. */}
                  <span
                    className={cn(
                      "flex items-center gap-1.5 text-lg/tight",
                      state === "alert"
                        ? "font-bold"
                        : "font-medium text-secondary"
                    )}
                  >
                    <StateMark
                      state={state}
                      className={cn("size-5", state === "ok" && "text-success")}
                    />
                    {value}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
      {/* The robot's top lines up with the status headline's. */}
      <div className="-mb-6 min-h-0 overflow-hidden *:object-top">
        {robotVideo}
      </div>
    </aside>
  )
}
