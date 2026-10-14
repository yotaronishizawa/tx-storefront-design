import { create } from "zustand"

import type { AuthSession } from "~/api/opm/schemas"

type SessionState = {
  /** True until startup has resolved a stored session; re-signing in from stored credentials is async. */
  isBootstrapping: boolean
  session: AuthSession | null
}

type SessionActions = {
  finishBootstrapping: () => void
  setSession: (session: AuthSession | null) => void
  signOut: () => void
}

const INITIAL_STATE: SessionState = {
  isBootstrapping: true,
  session: null,
}

export const useSessionStore = create<SessionState & SessionActions>((set) => ({
  ...INITIAL_STATE,

  finishBootstrapping: () => set({ isBootstrapping: false }),
  setSession: (session) => set({ session }),
  signOut: () => set({ session: null }),
}))

export function readSessionState(): SessionState & SessionActions {
  return useSessionStore.getState()
}

/** The current token, read at call time so a silent reauth does not restart whoever holds it. */
export function readSessionToken(): string {
  return useSessionStore.getState().session?.token ?? ""
}
