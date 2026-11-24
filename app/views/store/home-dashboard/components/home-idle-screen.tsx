import type { ReactNode } from "react"

import { useTranslation } from "react-i18next"

/**
 * Shown over Home after it sits untouched, laid out like station signage:
 * the robot status, and a full-width "touch the screen to start" strip at the
 * bottom. Any touch only wakes Home, so nothing underneath is pressed.
 * Operating status is left out until its design is settled.
 */
export function HomeIdleScreen({
  robotStatus,
  onWake,
}: {
  /** The robot status group (status, detectors, robot). */
  robotStatus: ReactNode
  onWake: () => void
}) {
  const { t } = useTranslation("app")
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={t("workflow.idle.wake")}
      // The strip keeps the old band's height: it is the only way out, so it
      // must not be missed.
      className="absolute inset-0 z-40 grid grid-rows-[minmax(0,1fr)_23%] bg-default outline-none"
      onClick={onWake}
      onKeyDown={onWake}
    >
      {robotStatus}
      {/* The instruction as the bottom strip, white with a hairline over it so
          it reads as its own place to press. */}
      <div className="flex items-center justify-center gap-6 border-t border-black/10 bg-default px-14 text-[3rem]/none font-bold tracking-wide text-primary">
        {/* A touch rippling out: a dot with rings that spread and fade. */}
        <span
          aria-hidden="true"
          className="relative grid size-13 shrink-0 place-items-center"
        >
          <span className="size-6 rounded-full bg-primary" />
          {/* Keeps rippling when the robot needs staff too: touching is
              how they reach what to do (Yotaro 2026-11-12). */}
          <span className="idle-wake-ripple absolute inset-0 rounded-full border-3 border-primary" />
          <span className="idle-wake-ripple absolute inset-0 rounded-full border-3 border-primary [animation-delay:2s]" />
        </span>
        {t("workflow.idle.wake")}
      </div>
    </div>
  )
}
