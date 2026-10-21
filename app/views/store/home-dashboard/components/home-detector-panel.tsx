import type { ParseKeys } from "i18next"
import { Box, Camera, Milk, Phone, UserRound } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router"

import type { RobotLiveCamera } from "~/api/opm/schemas"
import { OPERATIONS_CENTER_PHONE } from "~/config/app"
import { Button } from "~/core"
import type { RobotDetector } from "~/model/robot-attention"
import { formatDate } from "~/utils/date"
import { readStorage, writeStorage } from "~/utils/local-storage"

type DetectorCopy = {
  icon: typeof Box
  title: ParseKeys<"app">
  sub: ParseKeys<"app">
  /** When staff see nothing there: a false detection, so call support. */
  notFound: ParseKeys<"app">
  /** What was detected, for the picture's label. */
  thing: ParseKeys<"app">
}

/** The same words, icons and support line as the Unity app's detection popup. */
const DETECTOR_COPY: Record<RobotDetector, DetectorCopy> = {
  human: {
    icon: UserRound,
    title: "workflow.home.attention.titleHuman",
    sub: "workflow.home.attention.subHuman",
    notFound: "workflow.home.attention.notFoundHuman",
    thing: "workflow.home.attention.thingHuman",
  },
  obstacle: {
    icon: Box,
    title: "workflow.home.attention.titleObstacle",
    sub: "workflow.home.attention.subObstacle",
    notFound: "workflow.home.attention.notFoundObstacle",
    thing: "workflow.home.attention.thingObstacle",
  },
  fallenDrink: {
    icon: Milk,
    title: "workflow.home.attention.titleFallenDrink",
    sub: "workflow.home.attention.subFallenDrink",
    notFound: "workflow.home.attention.notFoundFallenDrink",
    thing: "workflow.home.attention.thingFallenDrink",
  },
}

/** Study: five ways to say what the picture is (`?camLabel=1..5`). */
const CAMERA_LABELS = [
  "workflow.home.attention.cameraLabel1",
  "workflow.home.attention.cameraLabel2",
  "workflow.home.attention.cameraLabel3",
  "workflow.home.attention.cameraLabel4",
  "workflow.home.attention.cameraLabel5",
] as const satisfies readonly ParseKeys<"app">[]
const CAMERA_LABEL_KEY = "storeApp.study.cameraLabel"

/**
 * A detector holds the robot. One screen whether it stopped mid-work or the
 * app's own restart found it, so the words say what happened and what to do,
 * not which of the two led here. Only the first camera may be shown.
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
  const { i18n, t } = useTranslation("app")
  const copy = DETECTOR_COPY[detector]
  const Icon = copy.icon
  const camera = cameras.find((frame) => frame.camera === 1)
  // Going in mid-work: only the detection stops the robot, so the store
  // stops it first. A human is already inside, so not for them.
  const offerHold = !retryable && detector !== "human"
  const [searchParams] = useSearchParams()
  const labelParam = searchParams.get("camLabel")
  if (labelParam !== null && /^[1-5]$/.test(labelParam))
    writeStorage(CAMERA_LABEL_KEY, labelParam)
  const labelKey =
    CAMERA_LABELS[Number(readStorage(CAMERA_LABEL_KEY) ?? "1") - 1] ??
    CAMERA_LABELS[0]

  return (
    <div className="grid min-h-0 flex-1 grid-cols-2 gap-5">
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex items-start gap-4">
          <span className="relative shrink-0 pt-1">
            <Icon aria-hidden="true" className="size-16 text-error" />
            <span
              aria-hidden="true"
              className="absolute -inset-e-2 -bottom-1 grid size-8 place-items-center rounded-full bg-error text-xl font-bold text-inverse"
            >
              !
            </span>
          </span>
          <div className="min-w-0">
            <h2 className="text-xl/tight font-bold">{t(copy.title)}</h2>
            <p className="mt-2 text-lg text-secondary">{t(copy.sub)}</p>
          </div>
        </div>

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

        <div className="flex flex-col gap-12">
          <div className="flex flex-col gap-2">
            <p className="flex items-center gap-2 text-base font-bold">
              <Phone aria-hidden="true" className="size-5 shrink-0" />
              {t(copy.notFound)}
            </p>
            <a
              href={`tel:${OPERATIONS_CENTER_PHONE}`}
              className="flex flex-col gap-1 rounded-lg border border-info/20 bg-info-subtle px-4 py-3"
            >
              <span className="text-base">
                {t("workflow.home.attention.falseDetection")}
              </span>
              <span className="text-xl font-bold text-info">
                {OPERATIONS_CENTER_PHONE}
              </span>
            </a>
          </div>
          {offerHold ? (
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
          )}
        </div>
      </div>

      <figure className="flex min-h-0 flex-col gap-4">
        <figcaption className="text-base font-bold">
          {t(labelKey, { detector: t(copy.thing) })}
        </figcaption>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-inverse text-inverse">
          <div className="relative grid min-h-48 flex-1 place-items-center">
            {camera?.src ? (
              <img
                src={camera.src}
                alt={t("workflow.home.attention.camera", { camera: 1 })}
                className="absolute inset-0 size-full object-contain"
                draggable={false}
              />
            ) : (
              <Camera className="size-12 opacity-40" />
            )}
          </div>
          {camera?.capturedAt != null && (
            <p className="px-3 py-2 text-end text-sm font-bold opacity-70">
              {t("workflow.home.attention.capturedAt", {
                time: formatDate(camera.capturedAt, "clock", i18n.language),
              })}
            </p>
          )}
        </div>
      </figure>
    </div>
  )
}
