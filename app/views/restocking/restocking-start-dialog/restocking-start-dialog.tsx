import { useEffect, useRef, useState } from "react"

import { TriangleAlert } from "lucide-react"
import { useTranslation } from "react-i18next"

import { RuleSection } from "~/components/dialog/rule-section"
import { RulesConfirmCheckbox } from "~/components/dialog/rules-confirm-checkbox"
import { Button, Dialog } from "~/core"

const RESTOCKING_RULE_ASSETS = {
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
    <Dialog.Root
      className="flex max-h-[calc(100svh-2rem)] max-w-3xl flex-col overflow-hidden p-5"
      initialFocus={cancelRef}
      layer="base"
      open={open}
      onDismiss={busy ? undefined : onCancel}
    >
      <Dialog.Title className="shrink-0 text-center">
        {resuming
          ? t("restockingResumePrompt")
          : t("restockingStartDialogTitle")}
      </Dialog.Title>

      {shelfSafety && (
        <p className="mt-3 flex shrink-0 items-center gap-2 rounded-md bg-warning-subtle px-3 py-2 text-xs font-bold text-primary">
          <TriangleAlert className="size-5 shrink-0 text-warning" />
          {t(shelfSafety)}
        </p>
      )}

      <Dialog.Content className="mt-3 grid gap-3 md:grid-cols-[2fr_1fr]">
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
      </Dialog.Content>

      <RulesConfirmCheckbox
        checked={confirmed}
        disabled={busy}
        onCheckedChange={setConfirmed}
      />

      <Dialog.Footer className="mt-4 grid-cols-1 gap-3 sm:grid-cols-2">
        <Button busy={busy} disabled={!confirmed} onClick={onConfirm}>
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
          variant="secondary"
          onClick={onCancel}
        >
          {t("common:actions.cancel")}
        </Button>
      </Dialog.Footer>
    </Dialog.Root>
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
function RuleFigure({ caption, src }: { caption: string; src: string }) {
  return (
    <figure className="flex min-w-0 flex-col">
      <img
        alt={caption}
        className="aspect-120/73 w-full object-contain"
        draggable={false}
        src={src}
      />
      <figcaption className="mt-1 text-center text-xs/tight font-bold text-primary">
        {caption}
      </figcaption>
    </figure>
  )
}
