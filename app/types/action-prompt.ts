// Shared here because the app-shell store queues the prompt and a view, which cannot import a domain, renders it.

/**
 * The buttons a popup offers. Two-button sets resolve "confirm" for the first
 * and "dismiss" for the second; the single-button ones resolve "dismiss",
 * except `retry`, `checklist-ok` and the `notification-*` ones, which confirm.
 */
export type PromptButtons =
  | "ok"
  | "close"
  | "retry"
  | "retry-cancel"
  | "retry-close"
  | "retry-logout"
  | "yes-no"
  | "confirmed-cancel"
  | "start-cancel"
  | "stop-cancel"
  | "boot-cancel"
  | "stop-confirmed"
  | "stop-and-enter"
  | "start-and-home"
  | "checklist-ok"
  | "return-to-manual"
  | "to-restocking"
  | "to-restocking-or-close"
  | "notification-check"
  | "notification-to-edit"
  | "notification-to-restocking"
  | "notification-to-home"

export type PromptChoice = "confirm" | "dismiss"

/** A photo shown under the message, e.g. the stop checklist's. */
export type PromptPhoto = { src: string; alt: string }

/** A question or failure waiting on the operator's answer. */
export type ActionPrompt = {
  buttons: PromptButtons
  /** Dismissing returns to home, closing whatever dialog started the action. */
  home: boolean
  message: string
  photos?: readonly PromptPhoto[]
}
