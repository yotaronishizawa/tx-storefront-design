import { useState } from "react"

import { useTranslation } from "react-i18next"

import { Button, Dialog, StatusList } from "~/core"
import { readRestockingState, useRecoveryLaneId } from "~/domains/restocking"
import { useStockBoard } from "~/domains/shelf"
import {
  findCell,
  findRow,
  getColumnLabel,
  getLaneErrorSummary,
  getLocationLaneErrors,
  getStockLocationSkuIds,
  isLocationBlocked,
  type LayoutCabinet,
} from "~/model/shelf"

type Step =
  /** Nothing touching the lane: the next drink, the walls, a price tag. */
  | "contact"
  /** One drink lifted off the front, to see the lane feels it. */
  | "lift"
  /** The lift was felt; the drink goes back where it was. */
  | "lifted"
  /** Weighed again with every drink back in place. */
  | "judge"
  /** The answer is in the shelf store; the next render reads it. */
  | "judged"
  | "matched"
  /** Still off: the lane is closed until the operations centre checks it. */
  | "disabled"
  /** Not off on weight, but red for something else (a drink too big). */
  | "remaining"

const STEP_COUNT = 3

/**
 * Restock study: "Followed the picture and it is still red" on the fix
 * screen opens this, Yotaro's recovery steps (Guided Recovery Wizard) in the
 * design system's popup. The picture of the lane is the fix screen's own,
 * so the steps start after it: nothing touching, one drink lifted to see
 * the lane weighs at all, then weighed again. Only a lane still off after
 * all that goes to the operations centre (the same ForceDiscrepancyResolution
 * "Already matches" called at once). Lives on the page, not the fix screen,
 * so a lane put right can still say so after the fix screen has moved on.
 */
export function RestockRecoveryWizard({
  checking,
  onCheckLaneMatched,
}: {
  checking: boolean
  onCheckLaneMatched: (
    locationId: string,
    options: { quiet: boolean }
  ) => Promise<boolean>
}) {
  const { t } = useTranslation(["app", "common"])
  const laneId = useRecoveryLaneId()
  const board = useStockBoard()
  const [step, setStep] = useState<Step>("contact")
  // The drinks the lane held when the lift began; fewer means it was felt.
  const [liftFrom, setLiftFrom] = useState(0)
  // The lift was asked about once with nothing felt.
  const [liftRetried, setLiftRetried] = useState(false)
  const [liftMissed, setLiftMissed] = useState(false)
  const [openedFor, setOpenedFor] = useState(laneId)
  // The codes as they stood before weighing: a closed lane loses its errors.
  const [judgedCodes, setJudgedCodes] = useState("")

  // Every lane starts from the first step.
  if (laneId !== openedFor) {
    setOpenedFor(laneId)
    setStep("contact")
    setLiftRetried(false)
    setLiftMissed(false)
  }

  const cell = findCell(board, laneId)
  const row = findRow(board, laneId)
  const location = cell?.location
  const held = location ? getStockLocationSkuIds(location).length : 0
  if (step === "lift" && held < liftFrom) {
    setStep("lifted")
  }
  if (step === "judged") {
    setStep(getOutcome(board, laneId))
  }

  function close() {
    readRestockingState().setRecoveryLaneId("")
  }
  function startLift() {
    setLiftFrom(held)
    setLiftMissed(false)
    setStep("lift")
  }
  async function judge() {
    if (!location) {
      return
    }
    setJudgedCodes(codes)
    const ok = await onCheckLaneMatched(location.id, { quiet: true })
    if (ok) {
      setStep("judged")
    }
  }

  const where =
    cell && row
      ? t("workflow.restock.location", {
          cabinet: cell.cabinet,
          row: cell.row,
          lane: getColumnLabel(cell, row, "stock"),
        })
      : ""
  const codes = location
    ? getLaneErrorSummary(location)
        .details.map((detail) => t("laneErrorCode", { code: detail.code }))
        .join("　")
    : ""
  const stepNumber = step === "contact" ? 1 : step === "judge" ? 3 : 2
  const done = step === "matched" || step === "disabled" || step === "remaining"
  const keepWorking = (
    <Button size="lg" variant="secondary" onClick={close}>
      {t("restockRecoveryKeepWorking")}
    </Button>
  )

  const view = getStepView()

  return (
    <Dialog.Popup
      actions={<Dialog.Actions>{view.actions}</Dialog.Actions>}
      closeLabel={t("common:actions.close")}
      icon={step === "disabled" || step === "remaining" ? "error" : undefined}
      open={Boolean(laneId && cell)}
      role="alertdialog"
      title={view.title}
      onClose={close}
    >
      {!done && (
        <p className="flex gap-4 text-base text-secondary">
          <span>
            {t("restockRecoveryStep", {
              current: stepNumber,
              total: STEP_COUNT,
            })}
          </span>
          <span>{where}</span>
        </p>
      )}
      {view.body}
    </Dialog.Popup>
  )

  function getStepView() {
    switch (step) {
      case "contact":
        return {
          title: t("restockRecoveryContactTitle"),
          body: (
            <>
              <p>{t("restockRecoveryContactHint")}</p>
              <ul className="flex list-disc flex-col gap-2 ps-7">
                <li>{t("restockRecoveryContactNeighbour")}</li>
                <li>{t("restockRecoveryContactWall")}</li>
                <li>{t("restockRecoveryContactForeign")}</li>
              </ul>
            </>
          ),
          actions: (
            <>
              <Button size="lg" onClick={startLift}>
                {t("restockRecoveryNext")}
              </Button>
              {keepWorking}
            </>
          ),
        }
      case "lift":
        return {
          title: liftMissed
            ? t("restockRecoveryLiftMissedTitle")
            : t("restockRecoveryLiftTitle"),
          body: (
            <>
              <p>
                {liftMissed
                  ? t("restockRecoveryLiftMissedHint")
                  : t("restockRecoveryLiftHint")}
              </p>
              <StatusList
                items={[
                  {
                    key: "weight",
                    label: t("restockRecoveryLiftWaiting"),
                    status: liftMissed ? "failed" : "running",
                  },
                ]}
              />
            </>
          ),
          actions: (
            <>
              <Button
                size="lg"
                onClick={() => {
                  // Asked once more; a second miss is weighed as it is.
                  if (liftRetried) {
                    setStep("judge")
                  } else {
                    setLiftRetried(true)
                    setLiftMissed(true)
                  }
                }}
              >
                {liftMissed
                  ? t("restockRecoveryLiftStillNothing")
                  : t("restockRecoveryLiftDone")}
              </Button>
              {keepWorking}
            </>
          ),
        }
      case "lifted":
        return {
          title: t("restockRecoveryLiftedTitle"),
          body: (
            <>
              <StatusList
                items={[
                  {
                    key: "weight",
                    label: t("restockRecoveryLiftWaiting"),
                    status: "done",
                  },
                ]}
              />
              <p>{t("restockRecoveryLiftedHint")}</p>
            </>
          ),
          actions: (
            <>
              <Button size="lg" onClick={() => setStep("judge")}>
                {t("restockRecoveryLiftedNext")}
              </Button>
              {keepWorking}
            </>
          ),
        }
      case "judge":
      case "judged":
        return {
          title: t("restockRecoveryJudgeTitle"),
          body: (
            <p className="whitespace-pre-line">
              {t(
                liftRetried && liftMissed
                  ? "restockRecoveryJudgeAfterMiss"
                  : "restockRecoveryJudgeHint"
              )}
            </p>
          ),
          actions: (
            <>
              <Button busy={checking} size="lg" onClick={() => void judge()}>
                {t("restockRecoveryJudge")}
              </Button>
              {keepWorking}
            </>
          ),
        }
      case "matched":
        return {
          title: t("restockRecoveryMatchedTitle"),
          body: <p>{t("restockRecoveryMatchedHint", { where })}</p>,
          actions: (
            <Button size="lg" onClick={close}>
              {t("restockRecoveryClose")}
            </Button>
          ),
        }
      case "disabled":
        return {
          title: t("restockRecoveryDisabledTitle"),
          body: (
            <>
              <p className="whitespace-pre-line">
                {t("restockRecoveryDisabledHint", { where })}
              </p>
              {/* For a call: what they would read out. */}
              {judgedCodes && (
                <p className="text-base text-secondary">{judgedCodes}</p>
              )}
            </>
          ),
          actions: (
            <Button size="lg" onClick={close}>
              {t("restockRecoveryClose")}
            </Button>
          ),
        }
      case "remaining":
        return {
          title: t("restockRecoveryRemainingTitle"),
          body: <p>{t("restockRecoveryRemainingHint")}</p>,
          actions: (
            <Button size="lg" onClick={close}>
              {t("restockRecoveryClose")}
            </Button>
          ),
        }
    }
  }
}

/** What the weighing left: put right, closed off, or red for another reason. */
function getOutcome(board: LayoutCabinet[], laneId: string): Step {
  const location = findCell(board, laneId)?.location
  if (!location || isLocationBlocked(location)) {
    return "disabled"
  }
  return getLocationLaneErrors(location).length > 0 ? "remaining" : "matched"
}
