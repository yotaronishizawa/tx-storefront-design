import type { RobotRestOutcome } from "~/model/robot-status"

import type { RecommendationChange } from "./recommendations"

export type LayoutSendOutcome =
  | {
      kind: "applied"
      recommendationChange: RecommendationChange | null
      /** Drinks gone from the display are still in the stock shelf. */
      leftoverStock: boolean
    }
  | { kind: "robot-not-resting"; reason: Exclude<RobotRestOutcome, "resting"> }
  | { kind: "accepted" | "review" | "failed" }
