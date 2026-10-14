import { ArrowDown, ArrowUp, TriangleAlert } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "~/core"

import {
  RobotArmIllustration,
  useRobotArmView,
  type RobotArmControlProps,
} from "./robot-arm-control"

/**
 * "Move the robot up or down" laid out as a card, for the walk-in screen:
 * the same arm, position and moves as the restocking screens' popover.
 */
export function RobotArmPanel({
  position,
  moving,
  enabled,
  onMove,
}: Omit<RobotArmControlProps, "open" | "onOpenChange">) {
  const { t } = useTranslation("app")
  const { shown, targets, arrow, sliding, setSliding } = useRobotArmView(
    position,
    moving
  )
  return (
    <section className="flex min-h-0 flex-col rounded-xl bg-default p-6">
      <h2 className="text-[1.875rem]/tight font-bold">
        {t("workflow.robotArm.open")}
      </h2>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 py-4">
        <RobotArmIllustration
          className="zoom-[1.4]"
          arrow={arrow}
          shown={shown}
          animate={moving !== null || sliding}
          onSlideEnd={() => setSliding(false)}
        />
        <p className="text-sm text-secondary">
          {t("workflow.walkIn.armPosition", {
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
      <div className="grid gap-3">
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
            className="min-h-16 gap-3 rounded-xl border-2 border-default bg-default px-5 text-lg font-bold text-primary active:bg-subtle disabled:opacity-50"
            onClick={() => onMove(target)}
          >
            {t(
              target === "top"
                ? "workflow.walkIn.armMoveTop"
                : "workflow.walkIn.armMoveBottom"
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
    </section>
  )
}
