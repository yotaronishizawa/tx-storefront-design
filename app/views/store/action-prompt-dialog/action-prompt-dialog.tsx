import { useTranslation } from "react-i18next"

import { ChoiceDialog } from "~/components/dialog/choice-dialog"
import { ConfirmDialog } from "~/components/dialog/confirm-dialog"
import { MessageDialog } from "~/components/dialog/message-dialog"
import type {
  ActionPrompt,
  PromptButtons,
  PromptChoice,
} from "~/types/action-prompt"

import { PromptPhotos } from "./components/prompt-photos"

type Labels = { confirm: string; dismiss?: string }

/** Laid out as their own design: a heading, a line under it, two answers. */
const CHOICE_PROMPTS = new Set<PromptButtons>([
  "stop-and-enter",
  "start-and-home",
  "start-cancel",
  "stop-cancel",
  "boot-cancel",
])

/** A lone button dismisses, except these. */
const LONE_CONFIRMING = new Set<PromptButtons>([
  "retry",
  "checklist-ok",
  "notification-check",
  "notification-to-edit",
  "notification-to-restocking",
  "notification-to-home",
])

/** The popup an OPM command, or a question before one, raises. */
export function ActionPromptDialog({
  prompt,
  onAnswer,
}: {
  prompt: ActionPrompt | null
  onAnswer: (choice: PromptChoice) => void
}) {
  const { t } = useTranslation(["app", "common"])

  const labels: Record<PromptButtons, Labels> = {
    ok: { confirm: t("common:actions.ok") },
    close: { confirm: t("common:actions.close") },
    retry: { confirm: t("common:actions.retry") },
    "retry-cancel": {
      confirm: t("common:actions.retry"),
      dismiss: t("common:actions.cancel"),
    },
    "retry-close": {
      confirm: t("common:actions.retry"),
      dismiss: t("common:actions.close"),
    },
    "retry-logout": {
      confirm: t("common:actions.retry"),
      dismiss: t("common:actions.logout"),
    },
    "yes-no": {
      confirm: t("common:boolean.yes"),
      dismiss: t("common:boolean.no"),
    },
    "confirmed-cancel": {
      confirm: t("confirmed"),
      dismiss: t("common:actions.cancel"),
    },
    "start-cancel": {
      confirm: t("workflow.robotPower.startConfirm"),
      dismiss: t("common:actions.cancel"),
    },
    "stop-cancel": {
      confirm: t("workflow.robotPower.stop"),
      dismiss: t("common:actions.cancel"),
    },
    "boot-cancel": {
      confirm: t("workflow.robotPower.bootConfirm"),
      dismiss: t("common:actions.cancel"),
    },
    "stop-confirmed": { confirm: t("robotStopConfirmedButton") },
    "start-and-home": {
      confirm: t("workflow.walkIn.startAndHome"),
      dismiss: t("common:actions.cancel"),
    },
    "stop-and-enter": {
      confirm: t("workflow.walkIn.stopAndEnter"),
      dismiss: t("common:actions.cancel"),
    },
    "checklist-ok": { confirm: t("common:actions.ok") },
    "return-to-manual": {
      confirm: t("returnToManualReplenishment"),
      dismiss: t("common:actions.close"),
    },
    "to-restocking": {
      confirm: t("goToRestocking"),
      dismiss: t("common:actions.cancel"),
    },
    "to-restocking-or-close": {
      confirm: t("goToRestocking"),
      dismiss: t("common:actions.close"),
    },
    "notification-check": { confirm: t("notificationCheckButton") },
    "notification-to-edit": { confirm: t("notificationToEditButton") },
    "notification-to-restocking": {
      confirm: t("notificationToRestockingButton"),
    },
    "notification-to-home": { confirm: t("notificationToHomeButton") },
  }
  const buttons = prompt?.buttons ?? "ok"
  const { confirm, dismiss } = labels[buttons]

  if (prompt && dismiss !== undefined && CHOICE_PROMPTS.has(buttons)) {
    // The first line is the heading; the rest, if any, goes under it.
    const [title = "", ...rest] = prompt.message.split("\n")
    return (
      <ChoiceDialog
        cancelLabel={dismiss}
        confirmLabel={confirm}
        message={rest.join("\n")}
        open
        title={title}
        onCancel={() => onAnswer("dismiss")}
        onConfirm={() => onAnswer("confirm")}
      />
    )
  }

  if (dismiss === undefined) {
    const choice = LONE_CONFIRMING.has(buttons) ? "confirm" : "dismiss"
    return (
      <MessageDialog
        message={prompt?.message ?? ""}
        okLabel={confirm}
        open={Boolean(prompt)}
        onClose={() => onAnswer(choice)}
      >
        {prompt?.photos && <PromptPhotos photos={prompt.photos} />}
      </MessageDialog>
    )
  }

  return (
    <ConfirmDialog
      cancelLabel={dismiss}
      confirmLabel={confirm}
      message={prompt?.message ?? ""}
      open={Boolean(prompt)}
      onCancel={() => onAnswer("dismiss")}
      onConfirm={() => onAnswer("confirm")}
    />
  )
}
