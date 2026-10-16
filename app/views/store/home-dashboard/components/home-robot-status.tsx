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
  look = "split",
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
  /** Study: which idle screen look to lay the parts out in. */
  look?: IdleLook
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
  // Calm states take a pale tint on the idle screen, with a dot for the colour;
  // a cause or a call for staff stays solid so it still leads.
  const calm = !assist && !cause
  const statusLabel = assist
    ? t("workflow.home.assist.badge")
    : cause
      ? t("workflow.home.attention.badge")
      : t(
          kind === "noRobot" || available
            ? ROBOT_STATUS_LABELS[kind]
            : ROBOT_STATUS_LABELS.unknown
        )
  const pill = (
    <p
      role="status"
      className={cn(
        "rounded-full font-bold",
        // Read from across the walk-in on the idle screen: 40 px there.
        wide
          ? "inline-flex items-center gap-3.5 py-2.5 ps-5 pe-7 text-[2.5rem]/tight tracking-wide"
          : "px-4 py-2 text-xl/tight",
        assist
          ? "bg-primary text-on-primary"
          : cause
            ? "attention-blink bg-error text-inverse"
            : moving
              ? wide
                ? "bg-success-subtle text-success"
                : "bg-success text-inverse"
              : wide
                ? "bg-default text-secondary ring-1 ring-black/10"
                : "bg-muted text-primary"
      )}
    >
      {wide && calm && (
        <span
          aria-hidden="true"
          className={cn(
            "size-4 shrink-0 rounded-full",
            moving ? "bg-success" : "bg-disabled"
          )}
        />
      )}
      {statusLabel}
    </p>
  )
  if (wide && look !== "split" && look !== "headline")
    return (
      <IdleAltLayout
        look={look}
        tone={assist ? "assist" : cause ? "cause" : moving ? "moving" : "rest"}
        statusLabel={statusLabel}
        robotVideo={robotVideo}
        detectors={detectors}
        heading={t("workflow.idle.safetyCheck")}
      />
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
        // Two columns on one centre line: the status over the robot, and the
        // safety check as a single card beside it.
        <div className="flex min-h-0 flex-1 items-center justify-center gap-24 px-10">
          <div className="flex h-full min-h-0 flex-col items-start gap-5 pt-2">
            {pill}
            <div className="min-h-0 flex-1 overflow-hidden">{robotVideo}</div>
          </div>
          <section className="w-[26rem] shrink-0 overflow-hidden rounded-xl bg-default shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_rgb(0_0_0/0.06)] ring-1 ring-black/5">
            <h2 className="px-6 pt-5 pb-2 text-sm font-bold tracking-wider text-secondary">
              {t("workflow.idle.safetyCheck")}
            </h2>
            <ul className="divide-y divide-black/5 px-3 pb-3">
              {detectors.map(({ key, ...item }) => (
                <DetectorRow key={key} {...item} wide />
              ))}
            </ul>
          </section>
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
  Icon: DetectorIcon
}[] = [
  { detector: "human", key: "workflow.home.v5.person", Icon: UserRound },
  { detector: "obstacle", key: "workflow.home.v5.obstacle", Icon: Box },
  {
    detector: "fallenDrink",
    key: "workflow.home.v5.droppedDrink",
    Icon: BottleIcon,
  },
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
  value,
  wide = false,
}: {
  Icon: DetectorIcon
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
      // Only the mark carries the colour; the names stay calm until
      // something is found, then the whole row turns red.
      <li
        className={cn(
          "flex items-center gap-4 rounded-md px-3 py-4 text-xl font-bold",
          state === "alert" ? "bg-error-subtle text-error" : "text-primary",
          state === "unknown" && "text-disabled"
        )}
      >
        <StateMark state={state} className={cn("size-7", tone)} />
        <Icon
          className={cn(
            "size-6 shrink-0",
            state === "ok" ? "text-secondary" : undefined
          )}
        />
        <span className="min-w-0 flex-1">{label}</span>
        <span
          className={cn(
            "shrink-0 text-base",
            state === "alert" ? "font-bold" : "font-medium text-secondary"
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

/**
 * A drink fallen over in its lane, for the fallen-drink detector: the bottle
 * (Figma "Group 247") on its side over a line. Fallen to the floor counts
 * as an obstacle, not this.
 */
function BottleIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      // A square like the Lucide icons beside it; stroke matched to their 2
      // on a 24 grid.
      viewBox="0 0 150 150"
      fill="none"
      stroke="currentColor"
      strokeWidth={12}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* The bottle lying on its side, cap to the left... */}
      <g transform="translate(8 100) rotate(-90)">
        <path d="M45.8 5H27.2C23.7758 5 21 7.83553 21 11.3333V17.6667C21 21.1645 23.7758 24 27.2 24H45.8C49.2242 24 52 21.1645 52 17.6667V11.3333C52 7.83553 49.2242 5 45.8 5Z" />
        <path d="M23.6 24V33.1765C23.6 39.2941 5 48.4706 5 63.7647V115.765C5 119.01 6.30642 122.122 8.63188 124.416C10.9573 126.711 14.1113 128 17.4 128H54.6C57.8887 128 61.0427 126.711 63.3681 124.416C65.6936 122.122 67 119.01 67 115.765V63.7647C67 48.4706 48.4 39.2941 48.4 33.1765V24" />
      </g>
      {/* ...on the lane it fell over in. */}
      <path d="M6 120H144" />
    </svg>
  )
}

export type IdleLook = "split" | "sign" | "ambient" | "headline"

type StatusTone = "assist" | "cause" | "moving" | "rest"

/**
 * Study looks for the idle screen, same parts as the split one:
 * - sign: station signage. The state as a big headline top left, the checks
 *   as a row of tiles under it, the robot standing full height on the right.
 * - ambient: a smart display. The whole screen takes the state's tint, the
 *   robot in the middle, the checks as a row of chips under it.
 */
function IdleAltLayout({
  look,
  tone,
  statusLabel,
  robotVideo,
  detectors,
  heading,
}: {
  look: Exclude<IdleLook, "split" | "headline">
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
        tone === "moving" ? "bg-success" : "bg-disabled"
      )}
    />
  )
  if (look === "sign")
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
                    "rounded-2xl px-8 py-5 text-inverse",
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
                    "flex items-center gap-3.5 rounded-xl px-4 py-4",
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
                        className={cn(
                          "size-5",
                          state === "ok" && "text-success"
                        )}
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
        <div className="-mb-6 min-h-0 overflow-hidden [&>*]:object-top">
          {robotVideo}
        </div>
      </aside>
    )
  // ambient
  return (
    <aside
      className={cn(
        "flex min-h-0 flex-1 flex-col items-center px-10 pt-10 pb-36 transition-colors duration-700",
        tone === "moving" && "bg-success-subtle",
        tone === "rest" && "bg-subtle",
        tone === "cause" && "bg-error-subtle",
        tone === "assist" && "bg-primary-subtle"
      )}
    >
      <p
        role="status"
        className={cn(
          "flex items-center gap-4 rounded-full px-8 py-3 text-[2.75rem]/tight font-bold",
          tone === "cause" && "attention-blink bg-error text-inverse",
          tone === "assist" && "bg-primary text-on-primary",
          tone === "moving" && "text-success",
          tone === "rest" && "text-secondary"
        )}
      >
        {!loud && <span className="contents [&>span]:size-5">{dot}</span>}
        {statusLabel}
      </p>
      <div className="min-h-0 w-full flex-1 overflow-hidden py-4">
        {robotVideo}
      </div>
      <ul aria-label={heading} className="flex flex-wrap justify-center gap-2.5">
        {detectors.map(({ key, Icon, label, state, value }) => (
          <li
            key={key}
            className={cn(
              "flex items-center gap-2.5 rounded-full py-2.5 ps-3.5 pe-5 text-lg font-bold shadow-[0_1px_2px_rgb(0_0_0/0.06)]",
              state === "alert"
                ? "bg-error text-inverse"
                : "bg-default/85 text-primary",
              state === "unknown" && "text-disabled"
            )}
          >
            <StateMark
              state={state}
              className={cn("size-6", state === "ok" && "text-success")}
            />
            <Icon className="size-6 shrink-0" />
            {label}
            <span
              className={cn(
                "text-base",
                state === "alert" ? "font-bold" : "font-medium text-secondary"
              )}
            >
              {value}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  )
}
