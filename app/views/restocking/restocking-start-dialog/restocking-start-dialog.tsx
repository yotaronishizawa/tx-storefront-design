import { useEffect, useRef, useState } from "react"

import { useTranslation } from "react-i18next"

import { RuleSection } from "~/components/dialog/rule-section"
import { RulesConfirmCheckbox } from "~/components/dialog/rules-confirm-checkbox"
import { Button, Dialog, Notice } from "~/core"

export const RESTOCKING_RULE_ASSETS = {
  longSideFront: "/assets/restocking/long-side-front.png",
  removeAndMove: "/assets/restocking/remove-and-move.png",
  shortSideFront: "/assets/restocking/short-side-front.png",
}

/** Start unlocks once the operator ticks the rules. */
export function RestockingStartDialog({
  busy,
  open,
  resuming,
  shelvesFlat,
  onCancel,
  stopsRobot,
  onConfirm,
}: {
  busy: boolean
  open: boolean
  /** A paused request exists, so ask to resume instead of to start. */
  resuming: boolean
  shelvesFlat: boolean
  onCancel: () => void
  /** Starting stops the working robot: the button says so. */
  stopsRobot: boolean
  onConfirm: () => void
}) {
  const { t } = useTranslation(["app", "common"])
  const cancelRef = useRef<HTMLButtonElement>(null)
  const [confirmed, setConfirmed] = useState(false)
  const shelfSafety = getShelfSafetyKey(resuming, shelvesFlat)

  useEffect(() => {
    if (open) {
      setConfirmed(false)
    }
  }, [open])

  return (
    <Dialog.Popup
      open={open}
      onClose={busy ? undefined : onCancel}
      closeLabel={t("common:actions.close")}
      title={
        resuming ? t("restockingResumePrompt") : t("restockingStartDialogTitle")
      }
      size="wide"
      initialFocus={cancelRef}
      layer="base"
      actions={
        // The tick stays next to the button it unlocks, outside the scrolling rules.
        <div className="flex shrink-0 flex-col gap-4">
          <RulesConfirmCheckbox
            checked={confirmed}
            disabled={busy}
            onCheckedChange={setConfirmed}
          />
          <Dialog.Actions>
            <Button
              busy={busy}
              disabled={!confirmed}
              size="lg"
              onClick={onConfirm}
            >
              {resuming
                ? t("restockingResume")
                : t(
                    stopsRobot
                      ? "workflow.start.stopAndStart"
                      : "stockReplenishStart"
                  )}
            </Button>
            <Button
              ref={cancelRef}
              disabled={busy}
              size="lg"
              variant="secondary"
              onClick={onCancel}
            >
              {t("common:actions.cancel")}
            </Button>
          </Dialog.Actions>
        </div>
      }
    >
      {shelfSafety && <Notice tone="warning">{t(shelfSafety)}</Notice>}

      <RestockingRules />
    </Dialog.Popup>
  )
}

/**
 * The restocking rules, as pictures: short side to the front, and leave the
 * stock already there.
 */
function RestockingRules() {
  const { t } = useTranslation("app")
  return (
    // The right column never narrows below its title's one line.
    <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
      <RuleSection
        subtitle={t("restockingRuleTopView")}
        title={t("restockingRuleShortSideTitle")}
      >
        <div className="grid grid-cols-2 gap-3">
          <RuleFigure
            caption={t("restockingRuleShortSideGood")}
            src={RESTOCKING_RULE_ASSETS.shortSideFront}
          />
          <RuleFigure
            caption={t("restockingRuleLongSideBad")}
            src={RESTOCKING_RULE_ASSETS.longSideFront}
          />
        </div>
      </RuleSection>
      <RuleSection title={t("restockingRuleKeepStockTitle")}>
        <RuleFigure
          caption={t("restockingRuleKeepStockBad")}
          src={RESTOCKING_RULE_ASSETS.removeAndMove}
        />
      </RuleSection>
    </div>
  )
}

/** As the store app: no warning to resume, and no angle change when the shelves are already flat. */
function getShelfSafetyKey(resuming: boolean, shelvesFlat: boolean) {
  if (resuming) {
    return undefined
  }
  if (shelvesFlat) {
    return "restockingStartShelfClear"
  }
  return "restockingStartShelfSafety"
}

// The illustrations carry their own good/bad frame and badge.
export function RuleFigure({ caption, src }: { caption: string; src: string }) {
  return (
    <figure className="flex min-w-0 flex-col">
      <img
        alt={caption}
        className="aspect-120/73 w-full object-contain"
        draggable={false}
        src={src}
      />
      <figcaption className="mt-1 text-center text-base/tight font-bold text-primary">
        {caption}
      </figcaption>
    </figure>
  )
}
