import { useEffect, useState } from "react"

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Triangle,
  TriangleAlert,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button, Popover } from "~/core"
import { cn } from "~/utils/cn"

export type RobotArmTarget = "top" | "bottom"

export type RobotArmControlProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Which end the arm is reported at; `null` between the ends or unreported. */
  position: RobotArmTarget | null
  /** Set while a confirmed move runs; the illustration travels there. */
  moving: RobotArmTarget | null
  /** Only a parked robot can move its arm. */
  enabled: boolean
  onMove: (target: RobotArmTarget) => void
}

/**
 * "Move the robot up or down" for the restocking and take-out screens: a
 * trigger beside "Find a drink" and a card with the arm's position, the one
 * move that makes sense from there, and the arm sliding along its rail.
 */
export function RobotArmControl({
  open,
  onOpenChange,
  position,
  moving,
  enabled,
  onMove,
}: RobotArmControlProps) {
  const { t } = useTranslation("app")
  // Keeps the slide running to its end even if the robot arrives first.
  const [sliding, setSliding] = useState(false)
  useEffect(() => {
    if (moving !== null) setSliding(true)
  }, [moving])
  // Where the illustration shows the arm: heading for the target while moving.
  const shown = moving ?? position
  const targets: RobotArmTarget[] =
    moving !== null
      ? [moving]
      : position === "bottom"
        ? ["top"]
        : position === "top"
          ? ["bottom"]
          : ["top", "bottom"]
  const arrow = moving ?? (targets.length === 1 ? targets[0] : null)

  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger
        render={
          <Button
            icon={<ArrowUpDown />}
            size="sm"
            type="button"
            variant="secondary"
          >
            {t("workflow.robotArm.open")}
          </Button>
        }
      />
      <Popover.Popup
        className="grid w-88 grid-cols-[minmax(0,1fr)_auto] gap-x-5 p-6"
        label={t("workflow.robotArm.title")}
      >
        <div className="col-span-2">
          <h2 className="text-xl font-bold">{t("workflow.robotArm.title")}</h2>
          <p className="mt-1 text-base text-secondary">
            {t("workflow.robotArm.position", {
              position: t(
                moving !== null
                  ? "workflow.robotArm.moving"
                  : position === "top"
                    ? "workflow.robotArm.top"
                    : position === "bottom"
                      ? "workflow.robotArm.bottom"
                      : "workflow.robotArm.unknown"
              ),
            })}
          </p>
        </div>

        <div className="mt-4 grid content-start gap-3">
          {targets.map((target) => (
            <Button
              key={target}
              disabled={!enabled || moving !== null}
              busy={moving === target}
              icon={
                target === "top" ? (
                  <ArrowUp className="size-6" />
                ) : (
                  <ArrowDown className="size-6" />
                )
              }
              size="lg"
              type="button"
              variant="unstyled"
              className="min-h-14 gap-3 rounded-xl bg-warning px-5 text-lg font-bold text-inverse disabled:opacity-50"
              onClick={() => onMove(target)}
            >
              {t(
                target === "top"
                  ? "workflow.robotArm.moveTop"
                  : "workflow.robotArm.moveBottom"
              )}
            </Button>
          ))}
          <p className="flex gap-2 text-sm text-secondary">
            <TriangleAlert className="size-5 shrink-0 text-primary-text" />
            {t(
              enabled
                ? "workflow.robotArm.warning"
                : "workflow.robotArm.unavailable"
            )}
          </p>
        </div>

        {/* Direction arrow, then the rail, its base and the arm (Figma "Group
            200", 68 x 166); the arm travels while a move runs. */}
        <div className="mt-4 flex gap-3" aria-hidden="true">
          <div
            className={cn(
              "relative w-6 self-stretch",
              arrow === null && "invisible"
            )}
          >
            <div className="absolute inset-y-2 left-1/2 w-[3px] -translate-x-1/2 rounded-full bg-[#cfd4dc]" />
            <Triangle
              className={cn(
                "absolute left-1/2 size-4 -translate-x-1/2 fill-current text-[#cfd4dc]",
                arrow === "bottom" ? "bottom-0 rotate-180" : "top-0"
              )}
              strokeWidth={0}
            />
          </div>
          <div className="relative h-41.5 w-17 shrink-0">
            <div className="absolute top-0 bottom-2.5 left-6 w-5 bg-app" />
            <div className="absolute right-0 bottom-0 left-0.5 h-2.5 rounded-md bg-app" />
            <div
              className={cn(
                "absolute left-0.5 h-8 w-16 rounded-[11px/7px] bg-[#878787]",
                // Slides only for a move; otherwise it is simply where it is.
                (moving !== null || sliding) &&
                  "transition-[top] duration-5000 ease-in-out",
                shown === "top"
                  ? "top-2"
                  : shown === "bottom"
                    ? "top-29"
                    : "top-15.5"
              )}
              onTransitionEnd={() => setSliding(false)}
            />
          </div>
        </div>
      </Popover.Popup>
    </Popover.Root>
  )
}
