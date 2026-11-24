/*
 * The restock study: a shelf with gaps, full lanes, mixed lanes and a
 * blocked lane, and the app's lane guidance. On by default; `?restockStudy=0`
 * turns it off until `?restockStudy=1`; the app reads the same key
 * (`app/config/restock-study.ts`).
 */
const STUDY_KEY = "tx-restock-study"

export function isRestockStudy() {
  try {
    const param = new URLSearchParams(globalThis.location?.search ?? "").get(
      "restockStudy"
    )
    if (param === "0") {
      globalThis.localStorage.setItem(STUDY_KEY, "0")
    } else if (param === "1") {
      globalThis.localStorage.removeItem(STUDY_KEY)
    }
    return globalThis.localStorage.getItem(STUDY_KEY) !== "0"
  } catch {
    return true
  }
}
