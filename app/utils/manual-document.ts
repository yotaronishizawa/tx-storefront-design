import { MANUAL_URL } from "~/config/app"

/** Opens the off-domain operator manual in a new tab, with no `window.opener` back into the app. */
export function openManualDocument() {
  window.open(MANUAL_URL, "_blank", "noopener,noreferrer")
}
