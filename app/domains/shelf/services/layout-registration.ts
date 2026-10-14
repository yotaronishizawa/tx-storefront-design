import { readStoreSelectionState } from "~/domains/store-selection"
import type { ShelfLocation } from "~/model/shelf"
import { cloneLocation, displayLayoutContents } from "~/model/shelf"

import { readShelfState } from "../shelf-store"
import {
  clearAppliedLayoutDraft,
  readPendingLayout,
  storePendingLayout,
} from "../storage/pending-layout-storage"

export function isCurrentLayoutStore(storeId: string): boolean {
  return readStoreSelectionState().selectedStoreId === storeId
}

/** All reload paths reconcile the same submitted snapshot before showing a shelf. */
export function applyRegisteredLayout(
  storeId: string,
  current: ShelfLocation[]
) {
  const pending = readPendingLayout(storeId)
  const applied = Boolean(
    pending &&
    displayLayoutContents(pending.locations) === displayLayoutContents(current)
  )
  if (pending && applied) {
    clearAppliedLayoutDraft(storeId, pending)
    storePendingLayout(storeId, null)
  }
  const awaiting = applied ? null : pending
  if (isCurrentLayoutStore(storeId)) {
    const shelf = readShelfState()
    shelf.setLayoutStoreId(storeId)
    shelf.setDisplayLocations(current)
    shelf.setEditedDisplayLocations(
      (awaiting?.locations ?? current).map(cloneLocation)
    )
    shelf.setPendingDisplayLayout(awaiting?.locations ?? null)
    shelf.setPendingDisplayLayoutIssue(awaiting?.issue ?? "")
    shelf.setPendingDisplayLayoutNeedCapture(
      awaiting?.needRobotCapture ?? false
    )
  }
  return awaiting
    ? awaiting.issue
      ? ("review" as const)
      : ("accepted" as const)
    : ("applied" as const)
}
