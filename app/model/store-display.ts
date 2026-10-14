import type { Agent, StockExpiryWarning, Store } from "~/api/opm/schemas"

export function getStoreRobotId(store: Store | null | undefined): string {
  return store?.robotId ?? ""
}

/** Returns OPM's own object, so its identity only changes with the store. */
export function getAgedStockRule(
  store: Store | null | undefined
): StockExpiryWarning | undefined {
  const warning = store?.config?.stockExpiryWarning
  return warning?.enabled && warning.thresholdDays > 0 ? warning : undefined
}

/** Whether a discrepancy can be seen to clear. Unknown reads as yes, OPM's default. */
export function hasShelfClient(store: Store | null | undefined): boolean {
  return store?.config?.smartShelves?.shelfClientEnabled ?? true
}

/**
 * A V2 store: smart stock shelves with no OPM shelf client, so the app, not
 * OPM, checks whether they are tilted for the robot.
 */
export function isLocalV2Store(store: Store | null | undefined): boolean {
  return (
    Boolean(store?.config?.smartStockShelvesEnabled) && !hasShelfClient(store)
  )
}

/**
 * The stores the account may open, sorted by English name. OPM's `GetStores`
 * only narrows the list for Junior accounts, so the rest is filtered here, as
 * the store app does. Managers, admins and robot accounts keep the whole list.
 *
 * @example listOperatorStores([a, b], { id: "op", access: "Normal", availableStores: [b.id] }) // [b]
 */
export function listOperatorStores(
  stores: Store[],
  agent: Agent | null
): Store[] {
  let allowed = stores
  if (agent?.access && agent.access !== "Manager" && agent.access !== "Admin") {
    allowed = stores.filter((store) => agent.availableStores.includes(store.id))
  }
  return [...allowed].sort((a, b) => a.storeNameEn.localeCompare(b.storeNameEn))
}
