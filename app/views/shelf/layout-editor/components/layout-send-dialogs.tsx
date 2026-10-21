import { useTranslation } from "react-i18next"

import type { Sku } from "~/api/opm/schemas"
import { ConfirmDialog } from "~/components/dialog/confirm-dialog"
import { MessageDialog } from "~/components/dialog/message-dialog"
import { Button, Dialog } from "~/core"
import type { RecommendationChange } from "~/model/shelf"
import { getLocalizedSkuName } from "~/model/sku"

import type { LayoutEditor } from "../hooks/use-layout-editor"

const ROBOT_MESSAGE = {
  "cannot-stop": "layoutRobotCannotStop",
  "not-started": "layoutRobotNotStarted",
  "waiting-operator": "layoutRobotWaitingOperator",
} as const

export function LayoutSendDialogs({
  send,
  skuById,
}: {
  send: LayoutEditor["send"]
  skuById: Map<string, Sku>
}) {
  const { t } = useTranslation(["app", "common"])
  const { step } = send

  return (
    <>
      <ConfirmDialog
        cancelLabel={t("common:actions.cancel")}
        confirmLabel={t("layoutReloadLatest")}
        message={t("layoutSendStale")}
        open={step?.kind === "stale"}
        onCancel={send.cancel}
        onConfirm={() => {
          void send.reloadLatest()
        }}
      />
      <MessageDialog
        message={step?.kind === "robot" ? t(ROBOT_MESSAGE[step.reason]) : ""}
        okLabel={t("common:actions.ok")}
        open={step?.kind === "robot"}
        onClose={send.closeRobotMessage}
      />
      <RecommendationChangeDialog
        change={step?.kind === "recommendations" ? step.change : null}
        skuById={skuById}
        onClose={send.closeRecommendations}
      />
      {/* Restock takes the scanner's trailing Enter, not a robot restart. */}
      <ConfirmDialog
        cancelLabel={t("layoutRestock")}
        confirmLabel={t("layoutReturnHome")}
        message={t("layoutSentNextStepPrompt")}
        open={step?.kind === "next-step"}
        onCancel={send.restock}
        onConfirm={() => {
          void send.returnHome()
        }}
      />
      <MessageDialog
        message={t("layoutReturnHomeFailed")}
        okLabel={t("common:actions.ok")}
        open={step?.kind === "return-home-failed"}
        onClose={send.restock}
      />
      <MessageDialog
        message={t("layoutLeftoverStockNotice")}
        okLabel={t("common:actions.ok")}
        open={step?.kind === "leftover-stock"}
        onClose={send.openRestocking}
      />
    </>
  )
}

function RecommendationChangeDialog({
  change,
  skuById,
  onClose,
}: {
  change: RecommendationChange | null
  skuById: Map<string, Sku>
  onClose: () => void
}) {
  const { i18n, t } = useTranslation(["app", "common"])

  const named = (skuIds: string[]) =>
    skuIds.map((skuId) => ({
      skuId,
      name: getLocalizedSkuName(skuById.get(skuId), i18n.language) || skuId,
    }))

  return (
    <Dialog.Popup
      open={Boolean(change)}
      onClose={onClose}
      closeLabel={t("common:actions.close")}
      title={t("layoutRecommendationsChangedTitle")}
      role="alertdialog"
      actions={
        <Dialog.Actions>
          <Button size="lg" onClick={onClose}>
            {t("common:actions.ok")}
          </Button>
        </Dialog.Actions>
      }
    >
      <p>{t("layoutRecommendationsChanged")}</p>
      <div className="grid gap-6 sm:grid-cols-2">
        <SkuNameList
          skus={named(change?.added ?? [])}
          title={t("layoutRecommendationsAdded")}
        />
        <SkuNameList
          skus={named(change?.removed ?? [])}
          title={t("layoutRecommendationsRemoved")}
        />
      </div>
    </Dialog.Popup>
  )
}

function SkuNameList({
  skus,
  title,
}: {
  skus: { name: string; skuId: string }[]
  title: string
}) {
  return (
    <section className="min-w-0">
      <h3 className="mb-2 font-bold">{title}</h3>
      {skus.length === 0 ? (
        <p className="text-secondary">—</p>
      ) : (
        <ul className="grid gap-1 text-base">
          {skus.map(({ name, skuId }) => (
            <li key={skuId}>{name}</li>
          ))}
        </ul>
      )}
    </section>
  )
}
