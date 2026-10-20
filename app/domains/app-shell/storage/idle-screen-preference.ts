import { create } from "zustand"

import { readStorage, writeStorage } from "~/utils/local-storage"

/**
 * How long Home may sit untouched before the idle screen shows. 0 turns the
 * idle screen off, and Home shows the robot status itself (as before).
 */
export const IDLE_TIMEOUT_OPTIONS_MS = [
  30_000, 60_000, 120_000, 300_000, 0,
] as const

export type IdleTimeoutMs = (typeof IDLE_TIMEOUT_OPTIONS_MS)[number]

const DEFAULT_IDLE_TIMEOUT_MS: IdleTimeoutMs = 60_000
// Kept on the tablet: no OPM change, and each tablet can differ.
const STORAGE_KEY = "storeApp.idleScreenTimeoutMs"

function readStoredTimeout(): IdleTimeoutMs {
  const raw = readStorage(STORAGE_KEY)
  if (raw === null) return DEFAULT_IDLE_TIMEOUT_MS
  const stored = Number(raw)
  return (
    IDLE_TIMEOUT_OPTIONS_MS.find((option) => option === stored) ??
    DEFAULT_IDLE_TIMEOUT_MS
  )
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
