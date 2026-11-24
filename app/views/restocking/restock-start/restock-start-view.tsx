import { useEffect, useState } from "react"

import { useTranslation } from "react-i18next"

import { CloseCountdown } from "~/components/feedback/close-countdown"
import { HangIpadPicture } from "~/components/robot/hang-ipad-picture"
import { RobotStatusColumn } from "~/components/robot/robot-status-column"
import { WalkInCard } from "~/components/robot/walk-in-card"
import { StatusList } from "~/core"
import { cn } from "~/utils/cn"

import { RESTOCKING_RULE_ASSETS, RuleFigure } from "../restocking-start-dialog"

/** How long each rule shows while the robot stops. */
const RULE_SECONDS = 4

/**
 * Starting a restock, on the walk-in screen's frame: the robot's status on
 * the left as there, and on the right the same card in two steps. While the
 * robot stops, the rules one at a time; once it has stopped, the iPad to
 * take in and when the restocking screen follows. The step beside the title
 * moves on, so the card reads as the next step, not another card.
 */
export function RestockStartView({
  carrySeconds,
  robotParked,
  shelvesSet,
  statusLabel,
}: {
  /** How long the iPad request stays before the restocking screen opens. */
  carrySeconds: number
  /** At its stop position; done from the start when it was already parked. */
  robotParked: boolean
  /** The shelves' angle is set, and restocking has started. */
  shelvesSet: boolean
  /** What the robot is doing, as the Home pill words it, already translated. */
  statusLabel: string
}) {
  const stopped = robotParked && shelvesSet
  const { t } = useTranslation("app")

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-subtle p-6">
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6">
        {/* What is being waited for, as the stopping popup lists it: the
            same two lines whether or not the robot was already parked. */}
        <RobotStatusColumn
          hint={
            <span className="flex flex-col gap-3">
              <StatusList
                // The shelves usually settle first, so they lead, as in the popup.
                items={[
                  {
                    key: "shelves",
                    label: t("workflow.robotStopping.stepShelves"),
                    status: shelvesSet ? "done" : "running",
                  },
                  {
                    key: "robot",
                    label: t("workflow.robotStopping.stepRobot"),
                    status: robotParked ? "done" : "running",
                  },
                ]}
              />
              {t(
                stopped
                  ? "workflow.robotStopping.stoppedTitle"
                  : "restockStart.stoppingBody"
              )}
            </span>
          }
          label={statusLabel}
          moving={!robotParked}
          resting={robotParked}
        />
        {stopped ? (
          <WalkInCard
            aside={<StepMarker current={2} total={2} />}
            caption={
              <p className="text-lg text-secondary">
                {t("restockStart.hangCaption")}
              </p>
            }
            footer={
              <div className="flex justify-center">
                <CloseCountdown
                  label={(seconds) => t("restockStart.toListIn", { seconds })}
                  seconds={carrySeconds}
                />
              </div>
            }
            title={t("restockStart.carryInTitle")}
          >
            <HangIpadPicture className="h-56 w-auto text-primary" />
          </WalkInCard>
        ) : (
          <RulesCard />
        )}
      </div>
    </section>
  )
}

/** Step 1: the rules to read in the wait, one at a time. */
function RulesCard() {
  const { t } = useTranslation("app")
  const rules = [
    {
      key: "short",
      caption: t("restockingRuleShortSideTitle"),
      figures: [
        {
          caption: t("restockingRuleShortSideGood"),
          src: RESTOCKING_RULE_ASSETS.shortSideFront,
        },
        {
          caption: t("restockingRuleLongSideBad"),
          src: RESTOCKING_RULE_ASSETS.longSideFront,
        },
      ],
    },
    {
      key: "keep",
      caption: t("restockingRuleKeepStockTitle"),
      figures: [
        {
          caption: t("restockingRuleKeepStockBad"),
          src: RESTOCKING_RULE_ASSETS.removeAndMove,
        },
      ],
    },
  ]
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % rules.length),
      RULE_SECONDS * 1000
    )
    return () => window.clearInterval(timer)
  }, [rules.length])
  const rule = rules[index]

  return (
    <WalkInCard
      aside={<StepMarker current={1} total={2} />}
      caption={<p className="text-xl font-bold">{rule.caption}</p>}
      footer={
        <span aria-hidden className="flex justify-center gap-2">
          {rules.map((item, itemIndex) => (
            <span
              key={item.key}
              className={cn(
                "size-2.5 rounded-full",
                itemIndex === index ? "bg-inverse" : "bg-muted"
              )}
            />
          ))}
        </span>
      }
      title={t("restockStart.rulesTitle")}
    >
      {/* No box around the pictures: they sit in the card as the arm does. */}
      <div
        className={cn(
          "grid w-full gap-4",
          rule.figures.length > 1 ? "grid-cols-2" : "max-w-sm grid-cols-1"
        )}
      >
        {rule.figures.map((figure) => (
          <RuleFigure key={figure.src} caption={figure.caption} src={figure.src} />
        ))}
      </div>
    </WalkInCard>
  )
}

function StepMarker({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex shrink-0 items-center gap-2 pt-2 text-base text-secondary">
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={cn(
            "h-1.5 w-8 rounded-full",
            index < current ? "bg-inverse" : "bg-muted"
          )}
        />
      ))}
      <span className="ml-1">
        {current} / {total}
      </span>
    </div>
  )
}
