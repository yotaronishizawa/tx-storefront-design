import { useState } from "react"

import type { RobotRestOutcome } from "~/model/robot-status"
import type { LayoutSendOutcome, RecommendationChange } from "~/model/shelf"

type LayoutSendStep =
  | { kind: "stale" }
  | { kind: "confirm" }
  | { kind: "robot"; reason: Exclude<RobotRestOutcome, "resting"> }
  | { kind: "recommendations"; change: RecommendationChange }
  | { kind: "next-step" }
  | { kind: "return-home-failed" }
  | { kind: "leftover-stock" }

export type LayoutSendHandlers = {
  onCheckLayoutCurrent: () => Promise<boolean>
  onReloadLatest: () => Promise<void>
  onSendLayoutChange: (needRobotCapture: boolean) => Promise<LayoutSendOutcome>
  onRefreshLayoutStatus: () => Promise<LayoutSendOutcome>
  /** Restarts the robot, which lets OPM close the layout change. */
  onReturnHome: () => Promise<boolean>
  onOpenRestocking: (leftoverStockAcknowledged: boolean) => void
  onLeave: () => void
}

/** Only confirmed registration offers the next task; uncertain writes stay open for readback. */
export function useLayoutSendFlow({
  handlers,
  hasChanges,
  needRobotCapture,
  hasPendingSubmission,
  onNoChanges,
  onSent,
}: {
  handlers: LayoutSendHandlers
  hasChanges: boolean
  needRobotCapture: boolean
  hasPendingSubmission: boolean
  onNoChanges: () => void
  onSent: () => void
}) {
  const [step, setStep] = useState<LayoutSendStep | null>(null)
  const [checking, setChecking] = useState(false)
  const [leftoverStock, setLeftoverStock] = useState(false)
  const [submissionStatus, setSubmissionStatus] = useState<
    "editing" | "accepted" | "review" | "applied"
  >(hasPendingSubmission ? "accepted" : "editing")

  async function requestSend() {
    if (hasPendingSubmission || checking) return
    if (!hasChanges) {
      onNoChanges()
      return
    }
    setChecking(true)
    try {
      const current = await handlers.onCheckLayoutCurrent()
      setStep({ kind: current ? "confirm" : "stale" })
    } finally {
      setChecking(false)
    }
  }

  async function reloadLatest() {
    setStep(null)
    await handlers.onReloadLatest()
  }

  async function confirmSend() {
    setStep(null)
    if (hasPendingSubmission) return
    applyOutcome(await handlers.onSendLayoutChange(needRobotCapture))
  }

  function applyOutcome(outcome: LayoutSendOutcome) {
    if (outcome.kind === "failed") {
      return
    }
    if (outcome.kind === "robot-not-resting") {
      setStep({ kind: "robot", reason: outcome.reason })
      return
    }

    setSubmissionStatus(outcome.kind)
    if (outcome.kind !== "applied") return

    onSent()
    setLeftoverStock(outcome.leftoverStock)
    setStep(
      outcome.recommendationChange
        ? { kind: "recommendations", change: outcome.recommendationChange }
        : { kind: "next-step" }
    )
  }

  async function refreshSubmissionStatus() {
    if (checking) return
    setChecking(true)
    try {
      applyOutcome(await handlers.onRefreshLayoutStatus())
    } finally {
      setChecking(false)
    }
  }

  // The draft is kept; the operator fixes the robot from home.
  function closeRobotMessage() {
    const leave = step?.kind === "robot" && step.reason !== "cannot-stop"
    setStep(null)
    if (leave) {
      handlers.onLeave()
    }
  }

  async function returnHome() {
    setStep(null)
    if (!(await handlers.onReturnHome())) {
      setStep({ kind: "return-home-failed" })
    }
  }

  function restock() {
    if (leftoverStock) {
      setStep({ kind: "leftover-stock" })
      return
    }
    setStep(null)
    handlers.onOpenRestocking(false)
  }

  function openRestocking() {
    setStep(null)
    handlers.onOpenRestocking(true)
  }

  return {
    checking,
    submissionStatus,
    step,
    cancel: () => setStep(null),
    closeRecommendations: () => setStep({ kind: "next-step" }),
    closeRobotMessage,
    confirmSend,
    reloadLatest,
    requestSend,
    refreshSubmissionStatus,
    restock,
    returnHome,
    openRestocking,
  }
}
