/*
 * The `/sim/*` scenario helpers, one file per area, each a list of routes
 * written GET first, then POST. `simulator/README.md` documents them; keep
 * both in step.
 */
import { PNP_JOB_CONTEXT_WARNINGS } from "../rpc/errors.mjs"
import { state } from "../state.mjs"
import { laneRoutes } from "./lanes.mjs"
import { faultableMethods, manualJobRoutes, opmRoutes } from "./opm.mjs"
import { requestRoutes } from "./requests.mjs"
import { robotRoutes } from "./robot.mjs"
import { get } from "./route.mjs"
import { scannerRoutes } from "./scanner.mjs"
import { stateRoutes } from "./state.mjs"
import { taskRoutes } from "./tasks.mjs"
import { workflowRoutes } from "./workflow.mjs"

// The routes, the methods a fault can go on with their error names, and the seed's lanes and drinks.
const catalogRoute = get("/sim/catalog", () => ({
  routes: [...SIM_ROUTES.keys()],
  methods: Object.entries(faultableMethods())
    .map(([name, method]) => ({
      name,
      errors: method.errors ?? null,
      robotErrors: method.robotErrors ?? null,
      detailOnlyError: Boolean(method.failDetail),
    }))
    .sort((a, b) => a.name.localeCompare(b.name)),
  pnpJobWarnings: Object.entries(PNP_JOB_CONTEXT_WARNINGS),
  lanes: state.stockLocations.map((location) => location.id),
  skus: state.skus.map(({ id, eanCode, itemName }) => ({
    id,
    eanCode,
    itemName,
  })),
}))

/** Every helper, keyed `METHOD /path`. */
export const SIM_ROUTES = new Map()
for (const route of [
  ...stateRoutes,
  catalogRoute,
  ...robotRoutes,
  ...scannerRoutes,
  ...laneRoutes,
  ...opmRoutes,
  ...manualJobRoutes,
  ...requestRoutes,
  ...taskRoutes,
  ...workflowRoutes,
]) {
  const key = `${route.method} ${route.path}`
  if (SIM_ROUTES.has(key)) {
    throw new Error(`Sim route ${key} is defined twice.`)
  }
  SIM_ROUTES.set(key, route.handler)
}
