import { readShelfLocationsStrict } from "~/api/opm/schemas"
import type { ShelfLocation } from "~/model/shelf"
import { displayLayoutIdentity } from "~/model/shelf"
import {
  readStorageJson,
  removeStorage,
  writeStorage,
} from "~/utils/local-storage"

export type PendingLayout = {
  locations: ShelfLocation[]
  issue: string
  requestId: string
  needRobotCapture?: boolean
}

const key = (storeId: string) => `tx-storefront:accepted-layout:${storeId}`
const draftKey = (storeId: string) =>
  `tx-storefront:display-layout-draft:${storeId}`

/** In-memory fallback also protects token refresh when localStorage is unavailable. */
const pendingByStore = new Map<string, PendingLayout>()

/** A sent write survives navigation, token refresh and a page reload. */
export function readPendingLayout(storeId: string): PendingLayout | null {
  const cached = pendingByStore.get(storeId)
  if (cached) return cached
  try {
    const value = readStorageJson(key(storeId))
    const record =
      value && typeof value === "object" && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : null
    const source = Array.isArray(value) ? value : record?.locations
    if (!Array.isArray(source)) return null
    const locations = readShelfLocationsStrict(source)
    if (!locations.length || locations.length !== source.length) return null
    const pending: PendingLayout = {
      locations,
      issue: typeof record?.issue === "string" ? record.issue : "",
      requestId: typeof record?.requestId === "string" ? record.requestId : "",
      needRobotCapture:
        typeof record?.needRobotCapture === "boolean"
          ? record.needRobotCapture
          : undefined,
    }
    pendingByStore.set(storeId, pending)
    return pending
  } catch {
    return null
  }
}

export function storePendingLayout(
  storeId: string,
  pending: PendingLayout | null
): void {
  if (pending) pendingByStore.set(storeId, pending)
  else pendingByStore.delete(storeId)
  try {
    if (pending) writeStorage(key(storeId), JSON.stringify(pending))
    else removeStorage(key(storeId))
  } catch {
    /* Keep the in-memory snapshot when storage is unavailable. */
  }
}

/** Clear only a draft of this submission, never a different locally saved edit. */
export function clearAppliedLayoutDraft(
  storeId: string,
  pending: PendingLayout
): void {
  try {
    const value = readStorageJson(draftKey(storeId))
    if (!value || typeof value !== "object" || Array.isArray(value)) return
    const draft = value as Record<string, unknown>
    if (!Array.isArray(draft.locations)) return
    const locations = readShelfLocationsStrict(draft.locations)
    if (locations.length !== draft.locations.length) return
    if (
      pending.needRobotCapture !== undefined &&
      draft.needRobotCapture !== pending.needRobotCapture
    )
      return
    if (
      displayLayoutIdentity(locations) ===
      displayLayoutIdentity(pending.locations)
    )
      removeStorage(draftKey(storeId))
  } catch {
    /* Clearing a completed draft must not break the registered result. */
  }
}
