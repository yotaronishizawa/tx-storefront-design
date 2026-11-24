import { create } from "zustand"

import {
  isAppliedScanReplay,
  type AppliedScan,
  type ScannerConnectionSource,
} from "~/model/scanner-scan"
import type { LaneMarks, RestockingPlacementState } from "~/model/shelf"
import { memoizeOne } from "~/utils/memoize-one"

import {
  clearStoredLaneAdditions,
  readStoredLaneAdditions,
  storeLaneAdditions,
} from "./storage/lane-additions-storage"

export type RestockingPlacement = RestockingPlacementState | undefined

/** Drinks added per lane during one restock request, keyed by its id. */
export type LaneAdditions = {
  countsByLaneId: ReadonlyMap<string, number>
  lastLaneId: string
  lastScan?: AppliedScan
  requestId: string
}

/** A scan OPM accepted as the current restocking drink. */
export type AppliedSkuScan = {
  code: string
  compatibilityKnown: boolean
  incompatibleLaneIds: string[]
  scannedAt?: string
  skuId: string
}

/** A scan the operator has to acknowledge, shown one at a time in arrival order. */
export type ScanAlert =
  | { code: string; kind: "not-in-system" }
  | { kind: "not-on-display"; skuId: string }
  | { kind: "no-scanned-drink" }
  | { kind: "lane-errors" }
  | { code: string; kind: "same-jan" }
  /** A code that is not a well-formed JAN: a misread, not an unregistered drink. */
  | { kind: "invalid-scan" }
  /** OPM refused the drink; `error` is the `SetCurrentRestockingSkuErrors` name, or "" when unknown. */
  | { code: string; error: string; kind: "refused" }
  | { kind: "disconnected" }

const NO_LANE_MARKS: LaneMarks = { locationId: "", removals: [] }

export const NO_LANE_ADDITIONS: LaneAdditions = {
  countsByLaneId: new Map(),
  lastLaneId: "",
  requestId: "",
}

export type PulledLane = { laneId: string; signal: number }

/** Two 1.2s pulses of the `lane-flash` animation in `app.css`. */
const PULLED_LANE_FLASH_MS = 2400

/**
 * The live restocking session. `currentPathname` lives here so the long-lived
 * scan and lane subscriptions can read the page without re-subscribing.
 */
export type GuidePlan = { skuId: string; laneIds: string[] }

type RestockingState = {
  currentPathname: string
  dismissedLaneErrorKey: string
  /** The manual replenishment this tab ended or is ending, so its close is not read as one from elsewhere. */
  endingManualRequestId: string
  /** Only a verified MR-to-RS transition skips its first entry confirmation. Never persisted. */
  continuedRestockingRequestId: string
  /** A layout-flow notice already acknowledged for the next RS entry only. */
  acknowledgedEntryMisplacementKey: string
  /** Cleared by pause/resume; an old hub scan must not restore a cleared SKU. */
  scanRestorationAllowed: boolean
  /** Invalidates an older in-flight scan when OPM clears its current SKU on resume. */
  scanGeneration: number
  laneAdditions: LaneAdditions
  laneCompatibilityKnown: boolean
  /** Restock study: the lanes to fill, in order, for the drink in `skuId`. */
  guidePlan: GuidePlan
  /** Restock study: the lanes the before-entry list showed, by drink, so a scan keeps to them. */
  entryPlans: Readonly<Record<string, string[]>>
  /** The lane whose drawer is open on the restocking board, or "". */
  laneDrawerId: string
  laneMarks: LaneMarks
  /**
   * The lane to open once the operator answers the Finish/Cancel prompt ("" to
   * close), or null when no prompt is open.
   */
  laneSwitchTarget: string | null
  localShelfConnected: boolean
  /** Asked to open the next error lane once no dialog is in the way. */
  nextErrorLaneRequested: boolean
  /**
   * Restock study: "Fix the lane" on the error popup, naming the lane it
   * showed. A new object for every press, so the board can tell presses apart.
   */
  errorFixRequest: { laneId: string } | null
  /** Restock study: the red lane whose recovery steps are open, or "". */
  recoveryLaneId: string
  /** The lane a drink was last pulled from during manual replenishment; `signal` replays its flash. */
  pulledLane: PulledLane
  scanAlerts: ScanAlert[]
  scannerConnected: boolean
  /** Percent; `undefined` while the scanner sends no battery at all. */
  scannerBatteryLevel: number | null | undefined
  scannedSkuId: string
  /**
   * A scan was applied since the operator last came to the restocking page.
   * Lane colours wait for one: a drink restored after a reload or a return
   * keeps its card, not its colours.
   */
  scannedThisVisit: boolean
  /** The shelves are already tilted for restocking, so starting will not move them. */
  shelvesFlat: boolean
  /** False until OPM first answers with the shelf and scanner status. */
  smartShelvesStatusKnown: boolean
  unstockableLaneIds: Set<string>
}

type RestockingActions = {
  /** Every accepted scan, even of the same drink, zeroes the lane counts, unless it replays the scan they started from. */
  applyScan: (scan: AppliedSkuScan) => void
  clearScan: () => void
  invalidateScan: () => void
  setContinuedRestockingRequestId: (requestId: string) => void
  setAcknowledgedEntryMisplacementKey: (key: string) => void
  /** Everything a finished restock leaves behind: scan, lane counts (and their stored copy), alerts. */
  clearRestockingSession: () => void
  dismissScanAlert: () => void
  setDismissedLaneErrorKey: (key: string) => void
  setEndingManualRequestId: (requestId: string) => void
  /** Restores this request's stored counts and scanned drink; anything stored for another request is dropped. */
  hydrateLaneAdditions: (requestId: string) => void
  /** Opens or closes the drawer, dropping any marks without asking. */
  setLaneDrawerId: (laneDrawerId: string) => void
  setLaneMarks: (laneMarks: LaneMarks) => void
  /** With drinks marked, asks Finish or Cancel before leaving the lane; otherwise switches at once. */
  requestLaneSwitch: (laneDrawerId: string) => void
  /** Cancel on that prompt: the marks go and the lane stays open. */
  cancelLaneSwitch: () => void
  setNextErrorLaneRequested: (requested: boolean) => void
  requestErrorFix: (laneId: string) => void
  setRecoveryLaneId: (laneId: string) => void
  setGuidePlan: (guidePlan: GuidePlan) => void
  setEntryPlans: (entryPlans: Readonly<Record<string, string[]>>) => void
  /** Flashes the lane green. */
  flashPulledLane: (laneId: string) => void
  /** Ignored when the same alert is already showing or queued. */
  pushScanAlert: (alert: ScanAlert) => void
  /** Applies signed per-lane changes, never below zero; a new `requestId` starts over. */
  recordLaneChanges: (
    requestId: string,
    changes: ReadonlyMap<string, number>
  ) => void
  /**
   * Shows the drink the shelf hub holds for the open restock, with its lanes
   * unknown. Replacing a drink already shown means a scan the app did not
   * apply, so the lane counts start over as for any scan.
   */
  restoreScannedSku: (skuId: string) => void
  setCurrentPathname: (currentPathname: string) => void
  setLocalShelfConnected: (localShelfConnected: boolean) => void
  setScannerConnected: (connected: boolean) => void
  setScannerBatteryLevel: (level: number | null | undefined) => void
  setShelvesFlat: (shelvesFlat: boolean) => void
  setSmartShelvesStatusKnown: (known: boolean) => void
}

const INITIAL_STATE: RestockingState = {
  currentPathname: "/",
  dismissedLaneErrorKey: "",
  endingManualRequestId: "",
  continuedRestockingRequestId: "",
  acknowledgedEntryMisplacementKey: "",
  scanGeneration: 0,
  scanRestorationAllowed: true,
  laneAdditions: NO_LANE_ADDITIONS,
  laneCompatibilityKnown: false,
  guidePlan: { skuId: "", laneIds: [] },
  entryPlans: {},
  laneDrawerId: "",
  laneMarks: NO_LANE_MARKS,
  laneSwitchTarget: null,
  localShelfConnected: false,
  nextErrorLaneRequested: false,
  errorFixRequest: null,
  recoveryLaneId: "",
  pulledLane: { laneId: "", signal: 0 },
  scannerConnected: false,
  scannerBatteryLevel: undefined,
  scanAlerts: [],
  scannedSkuId: "",
  scannedThisVisit: false,
  shelvesFlat: false,
  smartShelvesStatusKnown: false,
  unstockableLaneIds: new Set(),
}

function noScannedSku(): Pick<
  RestockingState,
  "laneCompatibilityKnown" | "scannedSkuId" | "unstockableLaneIds"
> {
  return {
    laneCompatibilityKnown: false,
    scannedSkuId: "",
    unstockableLaneIds: new Set(),
  }
}

export const useRestockingStore = create<RestockingState & RestockingActions>(
  (set, get) => ({
    ...INITIAL_STATE,

    applyScan: ({
      code,
      compatibilityKnown,
      incompatibleLaneIds,
      scannedAt,
      skuId,
    }) => {
      const { laneAdditions } = get()
      const replay = isAppliedScanReplay(
        laneAdditions.lastScan,
        code,
        scannedAt
      )
      set({
        laneAdditions: replay
          ? laneAdditions
          : {
              ...laneAdditions,
              countsByLaneId: new Map(),
              lastScan: {
                code,
                scannedAt: scannedAt ?? new Date().toISOString(),
              },
            },
        laneCompatibilityKnown: compatibilityKnown,
        scannedSkuId: skuId,
        scannedThisVisit: true,
        scanRestorationAllowed: true,
        unstockableLaneIds: new Set(incompatibleLaneIds),
      })
      persistRestockingSession(get())
    },
    // No-op when already clear: the session tracker calls this on every navigation.
    clearScan: () => {
      const state = get()
      const alreadyClear =
        state.scannedSkuId === "" &&
        !state.laneCompatibilityKnown &&
        state.unstockableLaneIds.size === 0
      if (alreadyClear) return
      set({ ...noScannedSku(), scannedThisVisit: false })
      persistRestockingSession(get())
    },
    invalidateScan: () => {
      get().clearScan()
      set((state) => ({
        scanGeneration: state.scanGeneration + 1,
        scanRestorationAllowed: false,
        scannedThisVisit: false,
      }))
    },
    setContinuedRestockingRequestId: (continuedRestockingRequestId) =>
      set({ continuedRestockingRequestId }),
    setAcknowledgedEntryMisplacementKey: (acknowledgedEntryMisplacementKey) =>
      set({ acknowledgedEntryMisplacementKey }),
    clearRestockingSession: () => {
      get().invalidateScan()
      clearStoredLaneAdditions()
      set({
        ...noScannedSku(),
        laneAdditions: NO_LANE_ADDITIONS,
        scanAlerts: [],
      })
    },
    dismissScanAlert: () =>
      set((state) => ({ scanAlerts: state.scanAlerts.slice(1) })),
    setDismissedLaneErrorKey: (dismissedLaneErrorKey) =>
      set({ dismissedLaneErrorKey }),
    setLaneDrawerId: (laneDrawerId) =>
      set({ laneDrawerId, laneMarks: NO_LANE_MARKS, laneSwitchTarget: null }),
    setLaneMarks: (laneMarks) => set({ laneMarks }),
    requestLaneSwitch: (laneDrawerId) => {
      const state = get()
      if (state.laneDrawerId && state.laneMarks.removals.length > 0) {
        set({ laneSwitchTarget: laneDrawerId })
        return
      }
      state.setLaneDrawerId(laneDrawerId)
    },
    cancelLaneSwitch: () =>
      set({ laneMarks: NO_LANE_MARKS, laneSwitchTarget: null }),
    setNextErrorLaneRequested: (nextErrorLaneRequested) =>
      set({ nextErrorLaneRequested }),
    requestErrorFix: (laneId) => set({ errorFixRequest: { laneId } }),
    setRecoveryLaneId: (recoveryLaneId) => set({ recoveryLaneId }),
    setGuidePlan: (guidePlan) => set({ guidePlan }),
    setEntryPlans: (entryPlans) => set({ entryPlans }),
    flashPulledLane: (laneId) => {
      const signal = get().pulledLane.signal + 1
      set({ pulledLane: { laneId, signal } })
      // Cleared once played, so a lane drawn later (another cabinet, a return
      // to the page) does not flash again; a newer pull keeps its own.
      window.setTimeout(() => {
        if (get().pulledLane.signal === signal) {
          set({ pulledLane: { laneId: "", signal } })
        }
      }, PULLED_LANE_FLASH_MS)
    },
    pushScanAlert: (alert) => {
      const key = getScanAlertKey(alert)
      const queued = get().scanAlerts
      if (queued.some((queuedAlert) => getScanAlertKey(queuedAlert) === key)) {
        return
      }
      set({ scanAlerts: [...queued, alert] })
    },
    hydrateLaneAdditions: (requestId) => {
      if (!requestId || get().laneAdditions.requestId === requestId) {
        return
      }
      const stored = readStoredLaneAdditions()
      const { lastScan } = get().laneAdditions
      if (stored?.requestId !== requestId) {
        // Claim the request now, so a scan before the first drink is stored too.
        clearStoredLaneAdditions()
        set({
          laneAdditions: { ...NO_LANE_ADDITIONS, lastScan, requestId },
        })
        persistRestockingSession(get())
        return
      }
      set({
        laneAdditions: {
          countsByLaneId: new Map(Object.entries(stored.counts)),
          lastLaneId: stored.lastLaneId,
          lastScan: stored.lastScan ?? lastScan,
          requestId,
        },
      })
      // A scan since the reload wins over the stored one.
      if (!get().scannedSkuId && stored.scannedSku) {
        set({
          laneCompatibilityKnown: stored.scannedSku.compatibilityKnown,
          scannedSkuId: stored.scannedSku.skuId,
          unstockableLaneIds: new Set(stored.scannedSku.incompatibleLaneIds),
        })
      }
      persistRestockingSession(get())
    },
    recordLaneChanges: (requestId, changes) => {
      // After a reload the stored counts may not be restored yet; merge onto them, not over them.
      get().hydrateLaneAdditions(requestId)
      const current = get().laneAdditions
      const sameRequest = current.requestId === requestId
      const counts = new Map(sameRequest ? current.countsByLaneId : [])
      let lastLaneId = sameRequest ? current.lastLaneId : ""
      for (const [laneId, change] of changes) {
        const count = Math.max(0, (counts.get(laneId) ?? 0) + change)
        if (count > 0) {
          counts.set(laneId, count)
        } else {
          counts.delete(laneId)
        }
        if (change > 0) {
          lastLaneId = laneId
        }
      }
      set({
        laneAdditions: {
          countsByLaneId: counts,
          lastLaneId,
          lastScan: current.lastScan,
          requestId,
        },
      })
      persistRestockingSession(get())
    },
    restoreScannedSku: (skuId) => {
      const { laneAdditions, scannedSkuId } = get()
      if (!skuId || scannedSkuId === skuId) {
        return
      }
      const nextLaneAdditions = scannedSkuId
        ? { ...laneAdditions, countsByLaneId: new Map<string, number>() }
        : laneAdditions
      set({
        laneAdditions: nextLaneAdditions,
        laneCompatibilityKnown: false,
        scannedSkuId: skuId,
        unstockableLaneIds: new Set(),
      })
      persistRestockingSession(get())
    },
    setCurrentPathname: (currentPathname) => {
      if (currentPathname !== get().currentPathname) {
        set({ currentPathname, scannedThisVisit: false })
      }
    },
    setEndingManualRequestId: (endingManualRequestId) =>
      set({ endingManualRequestId }),
    setLocalShelfConnected: (localShelfConnected) =>
      set({ localShelfConnected }),
    setScannerConnected: (scannerConnected) => set({ scannerConnected }),
    setScannerBatteryLevel: (scannerBatteryLevel) =>
      set({ scannerBatteryLevel }),
    setShelvesFlat: (shelvesFlat) => set({ shelvesFlat }),
    setSmartShelvesStatusKnown: (smartShelvesStatusKnown) =>
      set({ smartShelvesStatusKnown }),
  })
)

const buildPlacement = memoizeOne(
  (
    scannedSkuId: string,
    compatibilityKnown: boolean,
    unstockableLaneIds: Set<string>,
    scannedThisVisit: boolean
  ): RestockingPlacement => {
    if (!scannedSkuId) {
      return undefined
    }
    return {
      compatibilityKnown: compatibilityKnown && scannedThisVisit,
      scannedSkuId,
      unstockableLaneIds,
    }
  }
)

/** Undefined until something is scanned — the board renders normally then. */
export function selectRestockingPlacement(
  state: RestockingState
): RestockingPlacement {
  return buildPlacement(
    state.scannedSkuId,
    state.laneCompatibilityKnown,
    state.unstockableLaneIds,
    state.scannedThisVisit
  )
}

/** OPM's word: a live local hub does not mean the Pico scanner is plugged in. */
export function selectScannerConnected(state: RestockingState): boolean {
  return state.scannerConnected
}

/** Which channel scans arrive on while the scanner is connected. */
export function selectScannerConnectionSource(
  state: RestockingState
): ScannerConnectionSource {
  if (!state.scannerConnected) {
    return null
  }
  return state.localShelfConnected ? "signalr" : "opm"
}

export function readRestockingState(): RestockingState & RestockingActions {
  return useRestockingStore.getState()
}

/** Keeps `currentPathname`: it tracks the URL, not the operator's session. */
export function resetRestockingStore() {
  clearStoredLaneAdditions()
  const { currentPathname: _currentPathname, ...sessionState } = INITIAL_STATE
  useRestockingStore.setState(sessionState)
}

/** Stores the lane counts and the scanned drink, so a reload mid-restock shows both again. */
function persistRestockingSession({
  laneAdditions,
  laneCompatibilityKnown,
  scannedSkuId,
  unstockableLaneIds,
}: RestockingState): void {
  const scannedSku = scannedSkuId
    ? {
        compatibilityKnown: laneCompatibilityKnown,
        incompatibleLaneIds: [...unstockableLaneIds],
        skuId: scannedSkuId,
      }
    : undefined
  storeLaneAdditions({
    counts: Object.fromEntries(laneAdditions.countsByLaneId),
    lastLaneId: laneAdditions.lastLaneId,
    lastScan: laneAdditions.lastScan,
    requestId: laneAdditions.requestId,
    scannedSku,
  })
}

function getScanAlertKey(alert: ScanAlert): string {
  switch (alert.kind) {
    case "not-in-system":
    case "same-jan":
      return `${alert.kind}:${alert.code}`
    case "not-on-display":
      return `${alert.kind}:${alert.skuId}`
    case "refused":
      return `${alert.kind}:${alert.error}:${alert.code}`
    case "no-scanned-drink":
    case "lane-errors":
    case "invalid-scan":
    case "disconnected":
      return alert.kind
  }
}
