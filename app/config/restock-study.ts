/**
 * The restock study: lane guidance on the restocking screen and a study
 * shelf in the simulator. On by default; `?restockStudy=0` turns it off
 * (back to Federico's screen) until `?restockStudy=1`. The simulator reads
 * the same key (`simulator/src/study.mjs`).
 */
const STUDY_KEY = "tx-restock-study"

/** Drinks the study assumes one stock lane holds; OPM does not send a capacity. */
export const STUDY_LANE_CAPACITY = 8

/**
 * The one cabinet the study sends drinks to: the simulator's control panel can
 * place drinks only in cabinet 1 (the left shelf). The others still show.
 */
export const STUDY_GUIDE_CABINET = 1

/** Drinks one display facing holds, by volume: cans fit more. A study estimate. */
export function getStudyFacingCapacity(volume: number): number {
  return volume > 0 && volume <= 400 ? 10 : 8
}

/** Below this share of a full facing, a drink is urgent (from the 10/01 prototype). */
export const STUDY_URGENT_DISPLAY_RATIO = 0.35

export function isRestockStudy(): boolean {
  try {
    const param = new URLSearchParams(globalThis.location.search).get(
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

const VARIANT_KEY = "tx-restock-variant"

/**
 * Which restocking screen the study shows once restocking has started: "a",
 * the lane guide, or "b", Masaya's one screen with the scanned drink beside
 * the whole shelf (feat/mr-pick-plan-study), to set the two side by side.
 * `?restockVariant=b` switches until `?restockVariant=a`.
 */
export function getRestockVariant(): "a" | "b" {
  try {
    const param = new URLSearchParams(globalThis.location.search).get(
      "restockVariant"
    )
    if (param === "b") {
      globalThis.localStorage.setItem(VARIANT_KEY, "b")
    } else if (param === "a") {
      globalThis.localStorage.removeItem(VARIANT_KEY)
    }
    return globalThis.localStorage.getItem(VARIANT_KEY) === "b" ? "b" : "a"
  } catch {
    return "a"
  }
}
