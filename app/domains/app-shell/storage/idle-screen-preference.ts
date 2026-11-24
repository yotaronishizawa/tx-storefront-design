import { create } from "zustand"

import { readStorage, writeStorage } from "~/utils/local-storage"

/**
 * How long Home may sit untouched before the idle screen shows. Besides these
 * presets, staff can type any whole number of minutes up to
 * IDLE_TIMEOUT_MAX_MINUTES. Settings has no Off (Yotaro 2026-11-03); 0 (Home
 * shows the robot status itself) is left only for the `?idleScreen=off` study.
 */
export const IDLE_TIMEOUT_OPTIONS_MS = [
  30_000, 60_000, 120_000, 300_000,
] as const

export const IDLE_TIMEOUT_MIN_MINUTES = 1
export const IDLE_TIMEOUT_MAX_MINUTES = 60

export type IdleTimeoutMs = number

const DEFAULT_IDLE_TIMEOUT_MS: IdleTimeoutMs = 300_000
// Kept on the tablet: no OPM change, and each tablet can differ.
const STORAGE_KEY = "storeApp.idleScreenTimeoutMs"

/** A preset, whole minutes within the custom range, or 0 (study only). */
export function isValidIdleTimeoutMs(ms: number): boolean {
  if (ms === 0) return true
  if ((IDLE_TIMEOUT_OPTIONS_MS as readonly number[]).includes(ms)) return true
  const minutes = ms / 60_000
  return (
    Number.isInteger(minutes) &&
    minutes >= IDLE_TIMEOUT_MIN_MINUTES &&
    minutes <= IDLE_TIMEOUT_MAX_MINUTES
  )
}

function readStoredTimeout(): IdleTimeoutMs {
  const raw = readStorage(STORAGE_KEY)
  if (raw === null) return DEFAULT_IDLE_TIMEOUT_MS
  const stored = Number(raw)
  return isValidIdleTimeoutMs(stored) ? stored : DEFAULT_IDLE_TIMEOUT_MS
}

const useIdleScreenPreference = create<{ timeoutMs: IdleTimeoutMs }>(() => ({
  timeoutMs: readStoredTimeout(),
}))

export function useIdleTimeoutMs(): IdleTimeoutMs {
  return useIdleScreenPreference((state) => state.timeoutMs)
}

/** False when Settings turned the idle screen off. */
export function useIdleScreenEnabled(): boolean {
  return useIdleScreenPreference((state) => state.timeoutMs !== 0)
}

export function setIdleTimeoutMs(timeoutMs: IdleTimeoutMs): void {
  if (!isValidIdleTimeoutMs(timeoutMs)) return
  writeStorage(STORAGE_KEY, String(timeoutMs))
  useIdleScreenPreference.setState({ timeoutMs })
}

/** Turn the idle screen on (at the default wait) or off. */
export function setIdleScreenEnabled(enabled: boolean): void {
  const { timeoutMs } = useIdleScreenPreference.getState()
  if (enabled === (timeoutMs !== 0)) return
  setIdleTimeoutMs(enabled ? DEFAULT_IDLE_TIMEOUT_MS : 0)
}

/** Whether Home is showing the idle screen right now (the header hides what it would cover). */
const useIdleScreenShownStore = create<{ shown: boolean }>(() => ({
  shown: false,
}))

export function useIdleScreenShown(): boolean {
  return useIdleScreenShownStore((state) => state.shown)
}

export function setIdleScreenShown(shown: boolean): void {
  useIdleScreenShownStore.setState({ shown })
}
