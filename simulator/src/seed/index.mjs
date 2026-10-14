import { randomUUID } from "../utils/id.mjs"
import { createDisplayLocations, createStockLocations } from "./locations.mjs"
import { createSkus } from "./skus.mjs"

const STORE_ID = "SIM-BY1"
const ROBOT_ID = "SIM_GHOST_01"

/** The whole seed state; `/sim/reset` rebuilds it from here. */
export function createState() {
  const skus = createSkus()
  const displaySpec = {
    cabinets: [
      { curtainId: 1, index: 1, maxPosX: 0.4, minPosX: -1.2 },
      { curtainId: 2, index: 2, maxPosX: 1.8, minPosX: 0.4 },
    ],
    shelfCabinets: [
      { index: 1, maxPosX: 0.4, minPosX: -1.2 },
      { index: 2, maxPosX: 1.8, minPosX: 0.4 },
    ],
  }
  const stockSpec = {
    cabinets: [{ index: 1, curtainId: 0 }],
    shelfCabinets: [{ index: 1, origin: { y: 0 } }],
  }
  // The last SKU is left off the display shelf so the stock shelf has a misplaced drink.
  const displayLocations = createDisplayLocations(skus.slice(0, -1))
  const stockLocations = createStockLocations(skus)

  return {
    // `SetCabinetInfo` layouts, keyed `display-<index>` / `stock-<index>`.
    cabinetLayouts: {},
    curtainsOpen: false,
    manualEndOutcome: "success",
    restartError: 0,
    layoutOutcome: "apply",
    pendingDisplayLocations: null,
    commandLog: [],
    queuedJobCount: 0,
    // `/sim/faults` and `/sim/latency`; see `faults.mjs`.
    faults: {},
    latencyMs: 0,
    // `/sim/manual-job/warnings`: what `ValidatePnpJobWithWarnings` warns about.
    pnpJobWarnings: [],
    latestScan: {},
    scannerConnected: true,
    scannerPresent: true,
    shelfConnected: true,
    // `/sim/lane/unfixable`: lanes whose discrepancy survives a re-weigh.
    unfixableLaneIds: [],
    // Whether each hub accepts connections; see `/sim/*-hub/connection`.
    opmHubUp: true,
    shelfHubUp: true,
    currentRestockingId: "",
    currentRestockingSku: "",
    displayHistoryLocations: displayLocations.map((location, index) => ({
      ...location,
      skuId: skus[(index + 3) % skus.length].id,
    })),
    displayLocations,
    displayManualJobs: [],
    // Manual jobs by id: the published context and its `PnpJobResult`.
    manualJobs: {},
    displaySpec,
    recommendationCounts: Object.fromEntries(
      skus.slice(0, 8).map((sku, index) => [sku.id, 18 - index])
    ),
    // What `GetSkuRecommendations` answers: the list, `null` (a store OPM has
    // no recommendations document for yet) or `{ recommendations: null }`.
    recommendationsAnswer: "list",
    // The tx-stock-shelf hub's `GetLatestScan`: its last processed scan.
    latestLocalScan: null,
    // `/sim/notification` and `/sim/store-task` add to the first two;
    // `SetOperatorTask` fills the third.
    notifications: [],
    storeTasks: [],
    operatorTasks: [],
    // Every `RequestContext`; see `model/requests.mjs`.
    requests: [],
    requestSequences: {},
    robot: {
      id: ROBOT_ID,
      storeId: STORE_ID,
      // Working (AutomationPnpWorking), as in a store most of the day, so
      // "enter the walk-in" shows the robot travelling to its rest position.
      status: 3,
      opMode: 0,
      // `TeleopErrorCode` a teleoperation request carries; 10 FailedToGraspAtStock
      // is one staff may fix themselves.
      teleopErrorCode: 10,
      // RobotLiveData: what the detectors see, what stopped the robot, and
      // the e-stop (`RobotEStopStatus`: 0 Released, 1 Pressed, 2 NeedsReset).
      detection: { human: false, obstacle: false, fallenDrink: false },
      stoppedBy: null,
      eStop: 0,
      // Height of the arm on its rail, in metres, reported as joint states.
      // Provisional: see ARM_LIFT in `rpc/robot.mjs`.
      armHeight: 0.05,
    },
    skus,
    stockLocations,
    stockSpec,
    // `OnStockSkusChangedEvent.sequenceKey` / `sequentialId`: one key per
    // process, and a counter per batch.
    stockSkuSequence: { key: randomUUID(), next: 1 },
    storeSpecification: {
      storeId: STORE_ID,
      displaySpecification: displaySpec,
      stockSpecification: stockSpec,
      deploymentParamInfo: { motionInfo: { storeInfo: { mirrored: false } } },
    },
    stores: [
      {
        id: STORE_ID,
        storeName: STORE_ID,
        storeNameEn: "Simulator Store",
        config: {
          smartShelves: { shelfClientEnabled: true },
          smartStockShelvesEnabled: true,
          stockExpiryWarning: { enabled: true, thresholdDays: 7 },
        },
        robotId: ROBOT_ID,
        storeType: 0,
      },
    ],
    tokens: new Map(),
  }
}
