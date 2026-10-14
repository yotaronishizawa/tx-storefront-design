import { Outlet } from "react-router"

import { StoreRuntimeProvider } from "./_providers/store-runtime-provider"

/** Matched on every URL, so the SignalR connections and restocking session it owns survive navigation. Must never remount. */
export default function AppLayout() {
  return (
    <StoreRuntimeProvider>
      <Outlet />
    </StoreRuntimeProvider>
  )
}
