import type { ReactNode } from "react"

import { Camera, Phone, type LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { RobotLiveCamera } from "~/api/opm/schemas"
import { OPERATIONS_CENTER_PHONE } from "~/config/app"
import { formatDate } from "~/utils/date"

/**
 * The one shape every "needs attention" screen takes, after the Unity app's
 * detection popup: on the left what to do and why, anything the case needs,
 * who to call when it does not help, then the one action; on the right the
 * camera picture, when there is one. Without a picture the right half stays
 * empty, so the title and the button sit where they always do.
 */
export function AttentionLayout({
  icon: Icon,
  title,
  body,
  children,
  support,
  action,
  camera,
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
}) {
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
            <h2 className="text-xl/tight font-bold">{title}</h2>
            <p className="mt-2 text-lg whitespace-pre-line text-secondary">
              {body}
            </p>
          </div>
        </div>

        {children}

        <div className="flex flex-col gap-12">
          <div className="flex flex-col gap-2">
            <p className="flex items-center gap-2 text-base font-bold">
              <Phone aria-hidden="true" className="size-5 shrink-0" />
              {support.heading}
            </p>
            <a
              href={`tel:${OPERATIONS_CENTER_PHONE}`}
              className="flex flex-col gap-1 rounded-lg border border-info/20 bg-info-subtle px-4 py-3"
            >
              <span className="text-base">{support.body}</span>
              <span className="text-xl font-bold text-info">
                {OPERATIONS_CENTER_PHONE}
              </span>
            </a>
          </div>
          {action}
        </div>
      </div>

      {camera ? (
        <AttentionCamera
          frames={camera.frames}
          showDetectedKey={camera.showDetectedKey}
        />
      ) : (
        <span aria-hidden="true" />
      )}
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
  const { i18n, t } = useTranslation("app")
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
        {camera?.capturedAt != null && (
          <p className="px-3 py-2 text-end text-sm font-bold opacity-70">
            {t("workflow.home.attention.capturedAt", {
              time: formatDate(camera.capturedAt, "clock", i18n.language),
            })}
          </p>
        )}
      </div>
    </figure>
  )
}
