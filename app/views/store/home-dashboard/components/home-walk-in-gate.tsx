import { useState } from "react"

import { ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button, Dialog } from "~/core"

import { HomeObjectAction } from "./home-object-action"

/**
 * One way in to the walk-in (study, `?homeLayout=gate`): staff think "I am
 * going in", so that is the button, whatever the reason and whatever the
 * robot is doing. What they go in for comes next, and choosing it stops the
 * robot. An open restock or take-out goes straight back to its task.
 */
export function HomeWalkInGate({
  disabled,
  robotRunning,
  restockOpen,
  manualOpen,
  manualAvailable,
  onRestock,
  onManual,
  onOther,
}: {
  disabled: boolean
  /** The robot is out working, so choosing stops it; else it stays stopped. */
  robotRunning: boolean
  restockOpen: boolean
  manualOpen: boolean
  manualAvailable: boolean
  onRestock: () => void
  onManual: () => void
  /** In for anything else: the walk-in screen, without asking again. */
  onOther: () => void
}) {
  const { t } = useTranslation(["app", "common"])
  const [choosing, setChoosing] = useState(false)
  const openTask = restockOpen ? "restock" : manualOpen ? "manual" : null

  function choose(go: () => void) {
    setChoosing(false)
    go()
  }

  return (
    <>
      <Button
        variant="unstyled"
        size="unstyled"
        aria-label={t("workflow.gate.title")}
        disabled={disabled}
        onClick={() =>
          openTask === "restock"
            ? onRestock()
            : openTask === "manual"
              ? onManual()
              : setChoosing(true)
        }
        className="h-[50svh] w-full min-w-0 shrink-0 flex-col items-stretch justify-start gap-4 overflow-hidden rounded-lg border-2 border-default bg-default p-6 text-left whitespace-normal active:bg-subtle"
      >
        <span className="flex min-w-0 items-start gap-4">
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-[2rem]/tight font-bold text-primary">
              {t("workflow.gate.title")}
            </span>
            <span className="text-lg/snug text-secondary">
              {openTask
                ? t("workflow.gate.backToTask", {
                    task: t(
                      openTask === "restock"
                        ? "workflow.home.restock"
                        : "workflow.home.manual"
                    ),
                  })
                : t("workflow.gate.hint")}
            </span>
          </span>
          <ChevronRight className="size-10 shrink-0 text-secondary" />
        </span>
        <img
          src="/assets/home-study-2026-10-06/walk-in-enter.svg"
          alt=""
          draggable={false}
          className="min-h-0 w-full flex-1 rounded-md bg-[#DCEBF8] object-contain p-6"
        />
      </Button>

      <Dialog.Root
        className="grid w-240 max-w-[calc(100vw-2rem)] gap-6 p-6"
        open={choosing}
        onDismiss={() => setChoosing(false)}
      >
        <div className="grid gap-2">
          <Dialog.Title className="text-display/tight">
            {t("workflow.gate.question")}
          </Dialog.Title>
          <Dialog.Message className="text-left text-xl/snug font-normal">
            {t(
              robotRunning
                ? "workflow.gate.robotStops"
                : "workflow.gate.robotStaysStopped"
            )}
          </Dialog.Message>
        </div>
        <div className="grid h-80 grid-cols-3 gap-4">
          <HomeObjectAction
            kind="restock"
            label={t("workflow.home.restock")}
            disabled={false}
            onClick={() => choose(onRestock)}
          />
          <HomeObjectAction
            kind="manual"
            label={t("workflow.home.manual")}
            disabled={!manualAvailable}
            onClick={() => choose(onManual)}
          />
          <Button
            variant="unstyled"
            size="unstyled"
            onClick={() => choose(onOther)}
            className="size-full min-w-0 flex-col items-start justify-between rounded-lg border-2 border-default bg-subtle p-5 text-left whitespace-normal active:bg-muted"
          >
            <span className="text-[2rem]/tight font-bold text-primary">
              {t("workflow.gate.other")}
            </span>
            <img
              src="/assets/home-study-2026-10-06/enter.svg"
              alt=""
              draggable={false}
              className="h-24 w-auto self-center"
            />
            <span className="text-lg/snug text-secondary">
              {t("workflow.gate.otherHint")}
            </span>
          </Button>
        </div>
        <Button
          size="lg"
          variant="secondary"
          className="h-14 justify-self-end px-10 text-lg"
          onClick={() => setChoosing(false)}
        >
          {t("common:actions.cancel")}
        </Button>
      </Dialog.Root>
    </>
  )
}
