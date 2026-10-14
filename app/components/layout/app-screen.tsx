import type { ReactNode } from "react"

/** The full-viewport frame every top-level screen renders in. */
export function AppScreen({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex h-svh flex-col overflow-hidden bg-default text-primary">
      {children}
    </main>
  )
}
