import type { AuthSession } from "~/api/opm/schemas"

import { useSessionStore } from "./session-store"

export function useSession(): AuthSession | null {
  return useSessionStore((state) => state.session)
}

export function useIsBootstrapping(): boolean {
  return useSessionStore((state) => state.isBootstrapping)
}
