import type { ReactNode } from "react"

import { useTranslation } from "react-i18next"

import { cn } from "~/utils/cn"

import type { IdleLook } from "./home-robot-status"

/**
 * Shown over Home after it sits untouched: the robot status, and a
 * full-width "touch the screen to start" band. Any touch only wakes Home, so
 * nothing underneath is pressed. Operating status is left out until its
 * design is settled.
 */
export function HomeIdleScreen({
  robotStatus,
  attention,
  look = "split",
  onWake,
}: {
  /** The robot status group (status, detectors, robot). */
  robotStatus: ReactNode
  /** The robot needs staff: the ripple stops so the red status leads. */
  attention: boolean
  /** Study: `?idleLook=` sign / ambient / headline; split by default. */
  look?: IdleLook
  onWake: () => void
}) {
  const { t } = useTranslation("app")
  const ripple = (size: "lg" | "sm") => (
    // A touch rippling out: a dot with rings that spread and fade.
    <span
      aria-hidden="true"
      className={cn(
        "relative grid shrink-0 place-items-center",
        size === "lg" ? "size-13" : "size-10"
      )}
    >
      <span
        className={cn(
          "rounded-full bg-primary",
          size === "lg" ? "size-6" : "size-4.5"
        )}
      />
      {!attention && (
        <>
          <span className="idle-wake-ripple absolute inset-0 rounded-full border-3 border-primary" />
          <span className="idle-wake-ripple absolute inset-0 rounded-full border-3 border-primary [animation-delay:2s]" />
        </>
      )}
    </span>
  )
  const shell = (className: string, children: ReactNode) => (
    <div
      role="button"
      tabIndex={0}
      aria-label={t("workflow.idle.wake")}
      className={cn("absolute inset-0 z-40 outline-none", className)}
      onClick={onWake}
      onKeyDown={onWake}
    >
      {children}
    </div>
  )
  if (look === "headline")
    // The instruction leads, top left; the robot's state sits under it.
    return shell(
      "grid grid-rows-[auto_minmax(0,1fr)] bg-subtle",
      <>
        <div className="flex items-center gap-6 border-b border-black/5 bg-default px-14 py-9 text-[3.5rem]/none font-bold tracking-wide text-primary">
          {ripple("lg")}
          {t("workflow.idle.wake")}
        </div>
        {robotStatus}
      </>
    )
  if (look === "ambient")
    // The tint runs to the edges; the instruction floats over its foot.
    return shell(
      "flex flex-col",
      <>
        {robotStatus}
        <div className="absolute inset-x-0 bottom-10 flex justify-center">
          <div className="flex items-center gap-4 rounded-full bg-default py-4 ps-5 pe-9 text-[2rem]/none font-bold tracking-wide text-primary shadow-[0_2px_4px_rgb(0_0_0/0.06),0_12px_32px_rgb(0_0_0/0.10)]">
            {ripple("sm")}
            {t("workflow.idle.wake")}
          </div>
        </div>
      </>
    )
  if (look === "sign")
    // Signage: the instruction as the bottom strip, white with a hairline
    // over it so it reads as its own place to press.
    return shell(
      // The strip keeps the old band's height: it is the only way out, so it
      // must not be missed.
      "grid grid-rows-[minmax(0,1fr)_23%] bg-default",
      <>
        {robotStatus}
        <div className="flex items-center justify-center gap-6 border-t border-black/10 bg-default px-14 text-[3rem]/none font-bold tracking-wide text-primary">
          {ripple("lg")}
          {t("workflow.idle.wake")}
        </div>
      </>
    )
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={t("workflow.idle.wake")}
      className="absolute inset-0 z-40 grid grid-rows-[minmax(0,1fr)_20%] bg-subtle outline-none"
      onClick={onWake}
      onKeyDown={onWake}
    >
      {robotStatus}
      <div className="flex flex-col items-center justify-center border-t border-black/5 bg-default">
        <div className="flex items-center gap-5 text-[2.5rem] font-bold tracking-wider text-primary">
          {ripple("lg")}
          {t("workflow.idle.wake")}
        </div>
      </div>
    </div>
  )
}
