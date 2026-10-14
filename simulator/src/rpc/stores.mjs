import { state } from "../state.mjs"

export const storeMethods = {
  // Any ID signs in, as a Normal operator assigned to every seeded store.
  GetAgent: ([agentId]) => ({
    id: String(agentId ?? ""),
    agentType: 1,
    access: 1,
    availableStores: state.stores.map((store) => store.id),
  }),
  GetStores: () => state.stores,
  // Also answers as `GetStoreById`, an OPM alias (`rpc/index.mjs`).
  GetStore: ([storeId]) =>
    state.stores.find((store) => store.id === String(storeId ?? "")) ?? null,
  GetStoreSpecification: () => state.storeSpecification,
}
