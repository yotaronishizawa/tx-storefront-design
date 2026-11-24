import type { ReactNode } from "react"

import { Camera, type LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { RobotLiveCamera } from "~/api/opm/schemas"
import { SupportContact } from "~/components/support/support-contact"
import { cn } from "~/utils/cn"

/**
 * The one shape every "needs attention" screen takes: what to do and why
 * across the top; below, the camera picture (or another picture for the case)
 * on the left, and anything the case needs, who to call when it does not
 * help, then the one action on the right. Without a picture the lower part is
 * one column.
 */
export function AttentionLayout({
  icon: Icon,
  title,
  body,
  children,
  support,
  action,
  camera,
  aside,
}: {
  icon: LucideIcon
  /** What to do. */
  title: string
  /** Why the robot cannot move, and how it comes back. */
  body: string
  /** Steps or status lines between the text and the support line. */
  children?: ReactNode
  /** When this does not help: the heading, then what to tell support. */
  support: { heading: string; body: string }
  action?: ReactNode
  camera?: { frames: RobotLiveCamera[]; showDetectedKey: boolean }
  /** The right half when there is no camera picture. */
  aside?: ReactNode
}) {
  const picture = camera ? (
    <AttentionCamera
      frames={camera.frames}
      showDetectedKey={camera.showDetectedKey}
    />
  ) : (
    aside
  )
  return (
    // What to do runs the full width at the top, so it reads from across the
    // walk-in; below it the picture on the left, then who to call and the one
    // action on the right, where the eye ends (Yotaro 2026-11-12).
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <AttentionHeading icon={Icon} title={title} body={body} />
      <div
        className={cn(
          "grid min-h-0 flex-1 gap-6",
          picture ? "grid-cols-[minmax(0,6fr)_minmax(0,5fr)]" : "grid-cols-1"
        )}
      >
        {picture}
        <div className="flex min-w-0 flex-col gap-6">
          {children}
          <SupportContact heading={support.heading} message={support.body} />
          {action && <div className="mt-auto">{action}</div>}
        </div>
      </div>
    </div>
  )
}

/** The icon with its "!", what to do, and why. */
export function AttentionHeading({
  icon: Icon,
  title,
  body,
  titleId,
}: {
  icon: LucideIcon
  title: string
  body: string
  /** For a dialog to name itself after the title. */
  titleId?: string
}) {
  return (
    // A container, so the title can size itself to stay on one line.
    <div className="@container flex items-start gap-4">
      <span className="relative shrink-0 pt-1">
        <Icon aria-hidden="true" className="size-14 text-error" />
        <span
          aria-hidden="true"
          className="absolute -inset-e-2 -bottom-1 grid size-8 place-items-center rounded-full bg-error text-xl font-bold text-inverse"
        >
          !
        </span>
      </span>
      <div className="min-w-0">
        {/* One line wherever it can: as large as 48px, smaller when the
            longest titles (about 22 characters) would wrap. */}
        <h2
          id={titleId}
          className="text-[min(3rem,calc((100cqw-5rem)/22))]/tight font-bold"
        >
          {title}
        </h2>
        <p className="mt-3 text-xl whitespace-pre-line text-secondary">
          {body}
        </p>
      </div>
    </div>
  )
}

/** Only the first camera may be shown to stores. */
function AttentionCamera({
  frames,
  showDetectedKey,
}: {
  frames: RobotLiveCamera[]
  /** The key to the red dashed box the robot draws round what it detected. */
  showDetectedKey: boolean
}) {
  const { t } = useTranslation("app")
  const camera = frames.find((frame) => frame.camera === 1)
  return (
    <figure className="flex min-h-0 flex-col gap-4">
      <figcaption className="flex items-center justify-between gap-4 text-base font-bold">
        {t("workflow.home.attention.cameraLabel")}
        {showDetectedKey && (
          <span className="flex items-center gap-2">
            <svg
              aria-hidden="true"
              viewBox="0 0 36 4"
              className="h-1 w-9 text-[#FF2D20]"
            >
              {/* Four equal dashes, ending on a dash at both ends. */}
              <line
                x1="0"
                y1="2"
                x2="36"
                y2="2"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray="6 4"
              />
            </svg>
            {t("workflow.home.attention.detectedKey")}
          </span>
        )}
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
      </div>
    </figure>
  )
}
