import { useState } from "react"

import { useTranslation } from "react-i18next"

import { Button, Dialog } from "~/core"

/**
 * After Done, two steps. First the task itself is finished, said in its own
 * words, so staff hear that it is done. Then: go on to the other walk-in
 * task, or hand the shelves back to the robot. One question, one condition,
 * two buttons; the close icon stays. Without the other task to offer, the
 * second step only confirms handing back.
 */
export function FinishWorkDialog({
  mode,
  canContinue = true,
  open,
  busy,
  onCancel,
  onContinue,
  onFinish,
}: {
  mode: "restock" | "manual"
  canContinue?: boolean
  open: boolean
  busy: boolean
  onCancel: () => void
  onContinue: () => void
  onFinish: () => void
}) {
  const { t } = useTranslation(["app", "common"])
  const [completed, setCompleted] = useState(false)
  if (!open && completed) {
    setCompleted(false)
  }
  const task = mode === "restock" ? "Restock" : "Manual"
  const next = mode === "restock" ? "toManual" : "toRestock"
  const finish = (
    <Button
      busy={busy}
      size="lg"
      variant={canContinue ? "secondary" : "primary"}
      onClick={onFinish}
    >
      {t("workflow.handoff.finish")}
    </Button>
  )
  return (
    <>
      <Dialog.Popup
        open={open && !completed}
        onClose={onCancel}
        closeLabel={t("common:actions.close")}
        title={t(`workflow.handoff.complete${task}Title`)}
        actions={
          <Dialog.Actions>
            <Button size="lg" onClick={() => setCompleted(true)}>
              {t(`workflow.handoff.complete${task}`)}
            </Button>
            <Button size="lg" variant="secondary" onClick={onCancel}>
              {t("common:actions.cancel")}
            </Button>
          </Dialog.Actions>
        }
      >
        {/* Taking out ends with the drinks packed forward: done before it is finished. */}
        {mode === "manual" && (
          <div className="flex items-center gap-4">
            <img
              alt=""
              src="/assets/manual-replenishment/move-in-front.png"
              className="h-20 w-24 shrink-0 rounded-lg object-contain"
            />
            <p>{t("workflow.handoff.packForward")}</p>
          </div>
        )}
      </Dialog.Popup>
      <Dialog.Popup
        open={open && completed}
        onClose={busy ? undefined : onCancel}
        closeLabel={t("common:actions.close")}
        title={t(
          canContinue
            ? `workflow.handoff.${next}Title`
            : "workflow.handoff.finishTitle"
        )}
        actions={
          <Dialog.Actions>
            {canContinue ? (
              <>
                <Button disabled={busy} size="lg" onClick={onContinue}>
                  {t(`workflow.handoff.${next}`)}
                </Button>
                {finish}
              </>
            ) : (
              <>
                {finish}
                <Button
                  disabled={busy}
                  size="lg"
                  variant="secondary"
                  onClick={onCancel}
                >
                  {t("common:actions.cancel")}
                </Button>
              </>
            )}
          </Dialog.Actions>
        }
      >
        <p>{t("workflow.handoff.outsideHint")}</p>
      </Dialog.Popup>
    </>
  )
}
