import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"

import { useTranslation } from "react-i18next"

import type { ShelfSpec, Sku } from "~/api/opm/schemas"
import { useActiveCabinet } from "~/components/shelf/use-active-cabinet"
import { OPERATIONS_CENTER_PHONE } from "~/config/app"
import { FEATURES } from "~/config/feature"
import {
  alignWithBaseLayout,
  applyProductOperation,
  buildOriginalSkuMap,
  canToggleCabinetBlocked,
  emptiesARow,
  findSameJanSkuId,
  groupDisplayShelfLocations,
  hasLayoutChanges,
  isCabinetBlocked,
  isTallerProduct,
  layoutSignature,
  removeLocations,
  setCabinetBlocked,
  type LayoutCabinet,
  type LayoutCell,
  type LayoutDraftStorage,
  type LayoutRow,
  type ProductOperation,
  type ShelfLocation,
} from "~/model/shelf"
import { matchesSkuSearch } from "~/model/sku"
import type { BusyAction } from "~/types/busy-action"

import type {
  InsertTarget,
  PendingSameJan,
} from "../utils/change-display-layout-types"
import {
  useLayoutSendFlow,
  type LayoutSendHandlers,
} from "./use-layout-send-flow"

export type LayoutEditor = ReturnType<typeof useLayoutEditor>

/** Layout editor UI state; the edits themselves live in `model/shelf/layout-edit`. */
export function useLayoutEditor({
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
}: {
  productScan: { code: string; sequence: number } | null
  onScanEnabledChange: (enabled: boolean) => void
  hasPendingSubmission: boolean
  pendingNeedRobotCapture: boolean
  busyAction: BusyAction
  board: LayoutCabinet[]
  editedDisplayLocations: ShelfLocation[]
  initialDisplayLocations: ShelfLocation[]
  mirrored: boolean
  spec: ShelfSpec | null
  skus: Sku[]
  skuById: Map<string, Sku>
  draftStorage: LayoutDraftStorage
  sendHandlers: LayoutSendHandlers
  onLocationsChange: (locations: ShelfLocation[]) => void
}) {
  const { i18n, t } = useTranslation("app")

  const [currentCabinet, setCabinet] = useActiveCabinet(board)
  const [introStep, setIntroStep] = useState<"faces" | "height" | "editor">(
    hasPendingSubmission ? "editor" : "faces"
  )
  const [needRobotCapture, setNeedRobotCapture] = useState(
    hasPendingSubmission && pendingNeedRobotCapture
  )
  // Adding or removing lanes needs a "yes" to the faces question.
  const [facesChanged, setFacesChanged] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [pickerMode, setPickerMode] = useState<null | ProductOperation["type"]>(
    null
  )
  const [insertTarget, setInsertTarget] = useState<InsertTarget | null>(null)
  const [search, setSearch] = useState("")
  const [message, setMessage] = useState("")
  const [draftPromptOpen, setDraftPromptOpen] = useState(false)
  const [pendingHeightOperation, setPendingHeightOperation] =
    useState<ProductOperation | null>(null)
  const [pendingSameJan, setPendingSameJan] = useState<PendingSameJan | null>(
    null
  )
  const [lastAutoSavedSignature, setLastAutoSavedSignature] = useState("")

  const activeCabinetDisabled = isCabinetBlocked(currentCabinet)
  const canToggleActiveCabinet =
    FEATURES.cabinetExclusion &&
    currentCabinet !== undefined &&
    canToggleCabinetBlocked(board, currentCabinet.cabinet, mirrored)
  const disabledCabinets = useMemo(
    () =>
      new Set(board.filter(isCabinetBlocked).map((cabinet) => cabinet.cabinet)),
    [board]
  )
  const originalSkuByLocationId = useMemo(
    () => buildOriginalSkuMap(initialDisplayLocations),
    [initialDisplayLocations]
  )
  const initialBoard = useMemo(
    () => groupDisplayShelfLocations(initialDisplayLocations, spec),
    [initialDisplayLocations, spec]
  )
  const hasChanges = useMemo(
    () => hasLayoutChanges(initialBoard, board),
    [board, initialBoard]
  )
  const baseSignature = useMemo(
    () => layoutSignature(initialDisplayLocations),
    [initialDisplayLocations]
  )
  const filteredSkus = useMemo(
    () => skus.filter((sku) => matchesSkuSearch(sku, search, i18n.language)),
    [i18n.language, search, skus]
  )

  // A draft from an older layout would overwrite what changed since.
  useEffect(() => {
    if (hasPendingSubmission) return
    const draft = draftStorage.read()
    if (!draft) {
      return
    }
    if (draft.baseSignature !== baseSignature) {
      draftStorage.clear()
      setMessage(t("layoutDraftOutdated"))
      return
    }
    setDraftPromptOpen(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftStorage, hasPendingSubmission])

  useEffect(() => {
    if (!hasPendingSubmission) return
    setIntroStep("editor")
    setNeedRobotCapture(pendingNeedRobotCapture)
    setDraftPromptOpen(false)
    setPickerMode(null)
    setPendingHeightOperation(null)
    setPendingSameJan(null)
    setSelectedIds([])
  }, [hasPendingSubmission, pendingNeedRobotCapture])

  useEffect(() => {
    setSelectedIds((current) =>
      current.filter((id) =>
        editedDisplayLocations.some((location) => location.id === id)
      )
    )
  }, [editedDisplayLocations])

  useEffect(() => {
    if (introStep !== "editor" || hasPendingSubmission) {
      return
    }

    const signature = hasChanges
      ? `${baseSignature}:${layoutSignature(editedDisplayLocations)}:${facesChanged}:${needRobotCapture}`
      : ""
    if (signature === lastAutoSavedSignature) {
      return
    }

    if (hasChanges) {
      draftStorage.save({
        baseSignature,
        facesChanged,
        locations: editedDisplayLocations,
        needRobotCapture,
        savedAt: Date.now(),
      })
    } else {
      draftStorage.clear()
    }
    setLastAutoSavedSignature(signature)
  }, [
    baseSignature,
    draftStorage,
    editedDisplayLocations,
    facesChanged,
    hasChanges,
    hasPendingSubmission,
    introStep,
    lastAutoSavedSignature,
    needRobotCapture,
  ])

  const send = useLayoutSendFlow({
    handlers: sendHandlers,
    hasChanges,
    needRobotCapture,
    hasPendingSubmission,
    onNoChanges: () => setMessage(t("layoutNoChangesToSend")),
    onSent: () => {
      draftStorage.clear()
      setLastAutoSavedSignature("")
    },
  })

  const canScanProduct =
    introStep === "editor" &&
    !hasPendingSubmission &&
    !busyAction &&
    !send.step &&
    !send.checking &&
    !pendingHeightOperation &&
    !pendingSameJan &&
    (selectedIds.length > 0 || pickerMode === "insert")
  const lastScanSequence = useRef<number | null>(null)
  // Publish scan eligibility before the selected-face instruction is painted.
  useLayoutEffect(() => {
    onScanEnabledChange(canScanProduct)
    return () => onScanEnabledChange(false)
  }, [canScanProduct, onScanEnabledChange])
  useEffect(() => {
    if (!productScan || productScan.sequence === lastScanSequence.current)
      return
    lastScanSequence.current = productScan.sequence
    if (!canScanProduct) return
    setSearch(productScan.code)
    setPickerMode((current) => current ?? "replace")
  }, [productScan, canScanProduct])

  function applyDraft() {
    if (hasPendingSubmission) return
    const draft = draftStorage.read()
    if (!draft) {
      setMessage(t("layoutDraftInvalid"))
      setDraftPromptOpen(false)
      return
    }

    onLocationsChange(draft.locations)
    setNeedRobotCapture(draft.needRobotCapture)
    setFacesChanged(draft.facesChanged)
    setIntroStep("editor")
    setDraftPromptOpen(false)
  }

  function skipDraft() {
    if (hasPendingSubmission) return
    draftStorage.clear()
    setDraftPromptOpen(false)
  }

  function answerFacesQuestion(changed: boolean) {
    setFacesChanged(changed)
    setNeedRobotCapture((current) => current || changed)
    setIntroStep("height")
  }

  function answerHeightQuestion(changed: boolean) {
    setNeedRobotCapture((current) => current || changed)
    setIntroStep("editor")
  }

  function backToFacesQuestion() {
    setFacesChanged(false)
    setNeedRobotCapture(false)
    setIntroStep("faces")
  }

  function toggleCell(cell: LayoutCell) {
    if (!cell.location || disabledCabinets.has(cell.cabinet)) {
      return
    }

    setSelectedIds((current) =>
      current.includes(cell.id)
        ? current.filter((id) => id !== cell.id)
        : [...current, cell.id]
    )
  }

  function clearSelection() {
    setSelectedIds([])
  }

  function openReplacePicker() {
    if (selectedIds.length === 0) {
      setMessage(t("layoutNoSelectedLanes"))
      return
    }

    setSearch("")
    setPickerMode("replace")
  }

  function openInsertPicker(target: InsertTarget) {
    if (!facesChanged || disabledCabinets.has(target.cabinet)) {
      return
    }
    setInsertTarget(target)
    setSearch("")
    setPickerMode("insert")
  }

  function closePicker() {
    setPickerMode(null)
    setInsertTarget(null)
    setSearch("")
  }

  function beginProductOperation(skuId: string) {
    if (pickerMode === "replace") {
      closePicker()
      guardProductOperation({ selectedIds, skuId, type: "replace" })
      return
    }

    if (pickerMode === "insert" && insertTarget) {
      closePicker()
      guardProductOperation({ ...insertTarget, skuId, type: "insert" })
    }
  }

  // A taller drink is confirmed first, then a same-JAN drink.
  function guardProductOperation(operation: ProductOperation) {
    if (isTallerProduct(editedDisplayLocations, operation, skuById)) {
      setPendingHeightOperation(operation)
      return
    }

    guardSameJan(operation)
  }

  function guardSameJan(operation: ProductOperation) {
    const existingSkuId = findSameJanSkuId(
      editedDisplayLocations,
      operation.skuId,
      skuById
    )
    if (existingSkuId) {
      setPendingSameJan({ existingSkuId, operation })
      return
    }

    applyOperation(operation, null)
  }

  function applyOperation(
    operation: ProductOperation,
    replaceAllOfSkuId: string | null
  ) {
    const next = applyProductOperation(
      editedDisplayLocations,
      board,
      spec,
      operation,
      skuById,
      replaceAllOfSkuId
    )
    commitLocations(next.locations)
    setSelectedIds(next.selectedIds)
  }

  function commitLocations(locations: ShelfLocation[]) {
    onLocationsChange(
      alignWithBaseLayout(locations, initialDisplayLocations, spec)
    )
  }

  function removeLanes(ids: string[]) {
    if (!facesChanged) {
      return
    }
    if (ids.length === 0) {
      setMessage(t("layoutNoSelectedLanes"))
      return
    }

    const removed = new Set(ids)
    if (emptiesARow(board, removed)) {
      setMessage(t("layoutEmptyRowBlocked", { phone: OPERATIONS_CENTER_PHONE }))
      return
    }

    commitLocations(removeLocations(editedDisplayLocations, removed))
    setSelectedIds((current) => current.filter((id) => !removed.has(id)))
  }

  // The study selection bar can also remove an explicitly selected set across rows.
  function removeSelectedLanes() {
    removeLanes(selectedIds)
  }

  function removeSelectedLanesInRow(row: LayoutRow) {
    removeLanes(
      row.cells
        .filter((cell) => selectedIds.includes(cell.id))
        .map((cell) => cell.id)
    )
  }

  function setCabinetDisabled(disabled: boolean) {
    if (!currentCabinet || !canToggleActiveCabinet) {
      return
    }

    commitLocations(
      setCabinetBlocked(editedDisplayLocations, currentCabinet, disabled)
    )
    if (disabled) {
      const cabinetIds = new Set(
        currentCabinet.rows.flatMap((row) => row.cells.map((cell) => cell.id))
      )
      setSelectedIds((current) => current.filter((id) => !cabinetIds.has(id)))
    }
  }

  function saveDraftManually() {
    if (hasPendingSubmission) return
    const saved = draftStorage.save({
      baseSignature,
      facesChanged,
      locations: editedDisplayLocations,
      needRobotCapture,
      savedAt: Date.now(),
    })
    setMessage(
      t(saved ? "layoutDraftSaved" : "workflow.layout.draftUnavailable")
    )
  }

  function discardChanges() {
    if (hasPendingSubmission) return
    onLocationsChange(initialDisplayLocations)
    draftStorage.clear()
    setSelectedIds([])
  }

  function removeCell(cellId: string) {
    removeLanes([cellId])
  }

  function cancelHeightOperation() {
    setPendingHeightOperation(null)
  }

  function confirmHeightOperation() {
    const operation = pendingHeightOperation
    setPendingHeightOperation(null)
    if (operation) {
      guardSameJan(operation)
    }
  }

  // "No" cancels: keeping both would leave one drink under two SKUs.
  function confirmSameJan(replaceAll: boolean) {
    const pending = pendingSameJan
    setPendingSameJan(null)
    if (pending && replaceAll) {
      applyOperation(pending.operation, pending.existingSkuId)
    }
  }

  return {
    activeCabinetDisabled,
    canToggleActiveCabinet,
    currentCabinet,
    disabledCabinets,
    draftPromptOpen,
    facesChanged,
    filteredSkus,
    hasChanges,
    initialBoard,
    insertTarget: pickerMode === "insert" ? insertTarget : null,
    introStep,
    message,
    originalSkuByLocationId,
    pendingHeightOperation,
    pendingSameJan,
    pickerOpen: Boolean(pickerMode),
    search,
    selectedIds,
    send,
    answerFacesQuestion,
    answerHeightQuestion,
    applyDraft,
    backToFacesQuestion,
    beginProductOperation,
    cancelHeightOperation,
    clearMessage: () => setMessage(""),
    clearSelection,
    closePicker,
    confirmHeightOperation,
    confirmSameJan,
    openInsertPicker,
    openReplacePicker,
    removeCell,
    removeSelectedLanes,
    removeSelectedLanesInRow,
    selectCabinet: setCabinet,
    setCabinetDisabled,
    setSearch,
    saveDraftManually,
    discardChanges,
    skipDraft,
    toggleCell,
  }
}
