import type { ReactNode } from "react"

import { cn } from "~/utils/cn"

import { RobotClip } from "./robot-clip"

/**
 * The walk-in screen's left-hand side: what the robot is doing as Home's pill
 * words it, a line on what that means for staff, and the robot itself. The
 * walk-in and the restock start show the robot stopping the same way.
 */
export function RobotStatusColumn({
  hint,
  label,
  moving,
  resting,
}: {
  hint: ReactNode
  label: string
  /** Out working or travelling: the pill goes green. */
  moving: boolean
  /** Parked: the robot rests. */
  resting: boolean
}) {
  return (
    <div className="flex min-h-0 flex-col">
      <p
        role="status"
        className={cn(
          "self-start rounded-full px-6 py-2 text-[2rem]/tight font-bold",
          moving ? "bg-success text-inverse" : "bg-muted text-primary"
        )}
      >
        {label}
      </p>
      <p className="mt-4 max-w-md text-lg/relaxed">{hint}</p>
      <div className="mt-4 min-h-0 flex-1 overflow-hidden">
        {/* Same clips as the robot status on Home: resting once stopped. */}
        <RobotClip
          clip={resting ? "resting" : "normal"}
          className="pointer-events-none h-full w-auto max-w-full object-contain object-bottom-left"
        />
      </div>
    </div>
  )
}
