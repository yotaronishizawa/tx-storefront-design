import type { ReactNode } from "react"

import { useTranslation } from "react-i18next"

/**
 * Shown over Home after it sits untouched: the robot status, and a
 * full-width "touch the screen to start" band. Any touch only wakes Home, so
 * nothing underneath is pressed. Operating status is left out until its
 * design is settled.
 */
export function HomeIdleScreen({
  robotStatus,
  attention,
  onWake,
}: {
  /** The robot status group (status, detectors, robot). */
  robotStatus: ReactNode
  /** The robot needs staff: the ripple stops so the red status leads. */
  attention: boolean
  onWake: () => void
}) {
  const { t } = useTranslation("app")
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={t("workflow.idle.wake")}
      className="absolute inset-0 z-40 grid grid-rows-[minmax(0,1fr)_23%] bg-default outline-none"
      onClick={onWake}
      onKeyDown={onWake}
    >
      {robotStatus}
      <div className="flex flex-col items-center justify-center gap-2 border-t bg-default">
        <div className="flex items-center gap-6 text-[3.25rem] font-bold tracking-wide text-primary">
          {/* A touch rippling out: a dot with rings that spread and fade. */}
          <span
            aria-hidden="true"
            className="relative grid size-15 place-items-center"
          >
            <span className="size-8 rounded-full bg-primary" />
            {!attention && (
              <>
                <span className="idle-wake-ripple absolute inset-0 rounded-full border-4 border-primary" />
                <span className="idle-wake-ripple absolute inset-0 rounded-full border-4 border-primary [animation-delay:2s]" />
              </>
            )}
          </span>
          {t("workflow.idle.wake")}
        </div>
      </div>
    </div>
  )
}
