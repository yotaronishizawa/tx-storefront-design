import { useId } from "react"

import { OctagonX, Power } from "lucide-react"
import { useTranslation } from "react-i18next"

import { SupportContact } from "~/components/support/support-contact"
import { Button, Dialog } from "~/core"
import type { RobotEStop } from "~/model/robot-attention"

import { AttentionHeading } from "./attention-layout"

const ESTOP_ASSET = "/assets/estop/estop-released"

/**
 * The emergency stop, as a popup rather than a takeover: nothing in the app
 * fixes it (staff release the button, or call), so it says why and how once.
 * It closes by itself when the robot reports the button released; staff can
 * also close it and reopen it from the bar on Home.
 */
export function HomeEStopDialog({
  open,
  eStop,
  onClose,
}: {
  open: boolean
  eStop: RobotEStop | null
  onClose: () => void
}) {
  const { t } = useTranslation(["app", "common"])
  const titleId = useId()
  const needsReset = eStop === "needsReset"

  return (
    <Dialog.Root
      className="flex w-170 max-w-[calc(100vw-5rem)] flex-col gap-6 p-6"
      labelledById={titleId}
      open={open}
      role="alertdialog"
      onDismiss={onClose}
    >
      {needsReset ? (
        <AttentionHeading
          icon={Power}
          title={t("workflow.home.attention.eStopResetTitle")}
          body={t("workflow.home.attention.eStopResetSub")}
          titleId={titleId}
        />
      ) : (
        <>
          <AttentionHeading
            icon={OctagonX}
            title={t("workflow.home.attention.eStopTitle")}
            body={t("workflow.home.attention.eStopSub")}
            titleId={titleId}
          />
          <div className="flex flex-col gap-4">
            <ol className="grid gap-3 text-lg font-bold">
              {(
                [
                  "workflow.home.attention.eStopStep1",
                  "workflow.home.attention.eStopStep2",
                ] as const
              ).map((key, index) => (
                <li key={key} className="flex items-start gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-inverse text-base text-inverse">
                    {index + 1}
                  </span>
                  <span className="pt-0.5">{t(key)}</span>
                </li>
              ))}
            </ol>
            {/* How the button looks once released: it springs out and shows
                its red collar. Plays once and stays on that state. */}
            <figure className="ms-11 flex w-56 flex-col items-center gap-2">
              <video
                aria-label={t("workflow.home.attention.eStopReleasedCaption")}
                autoPlay
                muted
                playsInline
                poster={`${ESTOP_ASSET}.png`}
                className="aspect-640/598 w-full rounded-lg ring-1 ring-black/10"
              >
                <source src={`${ESTOP_ASSET}.webm`} type="video/webm" />
                <source src={`${ESTOP_ASSET}.mp4`} type="video/mp4" />
              </video>
              <figcaption className="text-base">
                {t("workflow.home.attention.eStopReleasedCaption")}
              </figcaption>
            </figure>
          </div>
        </>
      )}
      <div className="flex flex-col gap-12">
        <SupportContact
          heading={t(
            needsReset
              ? "workflow.home.attention.eStopResetSupport"
              : "workflow.home.attention.eStopSupport"
          )}
          message={t(
            needsReset
              ? "workflow.home.attention.eStopResetSupportBody"
              : "workflow.home.attention.supportBody"
          )}
        />
        <div className="flex flex-col gap-3">
          {/* What happens next, so staff need not keep the popup open. */}
          <p className="text-center text-base text-secondary">
            {t(
              needsReset
                ? "workflow.home.attention.eStopResetAutoClose"
                : "workflow.home.attention.eStopAutoClose"
            )}
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="w-full"
            onClick={onClose}
          >
            {t("common:actions.close")}
          </Button>
        </div>
      </div>
    </Dialog.Root>
  )
}
