import type { ReactNode } from "react"

import type { ShelfSpec, Sku } from "~/api/opm/schemas"
import type {
  LayoutCabinet,
  LayoutDraftStorage,
  ShelfLocation,
} from "~/model/shelf"
import type { BusyAction } from "~/types/busy-action"

import { LayoutCaptureQuestionStep } from "./components/change-display-layout-capture-step"
import { ChangeDisplayLayoutEditor } from "./components/change-display-layout-editor"
import { useLayoutEditor } from "./hooks/use-layout-editor"
import type { LayoutSendHandlers } from "./hooks/use-layout-send-flow"

export function LayoutEditorView({
  productScan,
  onScanEnabledChange,
  hasPendingSubmission,
  pendingIssue,
  pendingNeedRobotCapture,
  isOnline,
  board,
  busyAction,
  editedDisplayLocations,
  initialDisplayLocations,
  mirrored,
  robotWillStop,
  sendHandlers,
  spec,
  skus,
  skuById,
  draftStorage,
  titleLeading,
  onLocationsChange,
}: {
  productScan: { code: string; sequence: number } | null
  onScanEnabledChange: (enabled: boolean) => void
  hasPendingSubmission: boolean
  pendingIssue: string
  pendingNeedRobotCapture: boolean
  isOnline: boolean
  board: LayoutCabinet[]
  busyAction: BusyAction
  editedDisplayLocations: ShelfLocation[]
  initialDisplayLocations: ShelfLocation[]
  /** The robot rests at the highest cabinet's end. */
  mirrored: boolean
  robotWillStop: boolean
  sendHandlers: LayoutSendHandlers
  spec: ShelfSpec | null
  skus: Sku[]
  skuById: Map<string, Sku>
  draftStorage: LayoutDraftStorage
  titleLeading?: ReactNode
  onLocationsChange: (locations: ShelfLocation[]) => void
}) {
  const editor = useLayoutEditor({
    productScan,
    onScanEnabledChange,
    hasPendingSubmission,
    pendingNeedRobotCapture,
    busyAction,
    board,
    editedDisplayLocations,
    initialDisplayLocations,
    mirrored,
    spec,
    skus,
    skuById,
    draftStorage,
    sendHandlers,
    onLocationsChange,
  })

  if (editor.introStep !== "editor") {
    return (
      <LayoutCaptureQuestionStep
        editor={editor}
        step={editor.introStep}
        titleLeading={titleLeading}
      />
    )
  }

  return (
    <ChangeDisplayLayoutEditor
      board={board}
      busyAction={busyAction}
      editor={editor}
      isOnline={isOnline}
      hasPendingSubmission={hasPendingSubmission}
      pendingIssue={pendingIssue}
      robotWillStop={robotWillStop}
      skuById={skuById}
    />
  )
}
