import type { AppliedScan } from "~/model/scanner-scan"
import {
  readStorageJson,
  removeStorage,
  writeStorage,
} from "~/utils/local-storage"

const RESTOCKING_LANES_KEY = "tx-storefront:restocking-lane-additions"

/** Per-lane drink counts of one restock request, so a reload mid-session keeps them. */
type StoredLaneAdditions = {
  counts: Record<string, number>
  lastLaneId: string
  /** The scan the counts started from. */
  lastScan?: AppliedScan
  requestId: string
  /** The drink on the "Scanned drink" card. OPM cannot give it back after a reload. */
  scannedSku?: StoredScannedSku
}

type StoredScannedSku = {
  compatibilityKnown: boolean
  incompatibleLaneIds: string[]
  skuId: string
}

export function readStoredLaneAdditions(): StoredLaneAdditions | null {
  const value = readStorageJson(RESTOCKING_LANES_KEY)
  return isStoredLaneAdditions(value) ? value : null
}

/** One entry only: storing a new request's counts drops the previous request's. */
export function storeLaneAdditions(additions: StoredLaneAdditions): void {
  if (!additions.requestId) {
    return
  }
  writeStorage(RESTOCKING_LANES_KEY, JSON.stringify(additions))
}

export function clearStoredLaneAdditions(): void {
  removeStorage(RESTOCKING_LANES_KEY)
}

function isStoredLaneAdditions(value: unknown): value is StoredLaneAdditions {
  if (value === null || typeof value !== "object") {
    return false
  }
  const { counts, lastLaneId, lastScan, requestId, scannedSku } =
    value as Record<string, unknown>
  return (
    typeof requestId === "string" &&
    requestId !== "" &&
    typeof lastLaneId === "string" &&
    (lastScan === undefined || isAppliedScan(lastScan)) &&
    (scannedSku === undefined || isStoredScannedSku(scannedSku)) &&
    counts !== null &&
    typeof counts === "object" &&
    Object.values(counts).every(
      (count) => typeof count === "number" && count > 0
    )
  )
}

function isAppliedScan(value: unknown): value is AppliedScan {
  if (value === null || typeof value !== "object") {
    return false
  }
  const { code, scannedAt } = value as Record<string, unknown>
  return typeof code === "string" && typeof scannedAt === "string"
}

function isStoredScannedSku(value: unknown): value is StoredScannedSku {
  if (value === null || typeof value !== "object") {
    return false
  }
  const { compatibilityKnown, incompatibleLaneIds, skuId } = value as Record<
    string,
    unknown
  >
  return (
    typeof skuId === "string" &&
    skuId !== "" &&
    typeof compatibilityKnown === "boolean" &&
    Array.isArray(incompatibleLaneIds) &&
    incompatibleLaneIds.every((id) => typeof id === "string")
  )
}
