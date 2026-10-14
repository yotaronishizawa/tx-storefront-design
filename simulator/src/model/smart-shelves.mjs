import { state } from "../state.mjs"
import { dateTimeOffsetNow } from "../utils/time.mjs"

// `SmartShelfModes` (`SmartShelves/RpcGateway.CabinetStatusSubscription.cs:47`).
const SMART_SHELF_MODE = { disconnected: 1, robotOperation: 3, restocking: 4 }

/**
 * OPM's `SmartShelvesStatus` (`CabinetStatusSubscription.cs:111`).
 * `scannerStatus` is `null` for a store with no scanner.
 */
export function smartShelvesStatus(storeId) {
  return {
    storeId: storeId || state.robot.storeId,
    isConnected: state.shelfConnected,
    reportedAt: dateTimeOffsetNow(),
    mode: !state.shelfConnected
      ? SMART_SHELF_MODE.disconnected
      : state.currentRestockingId
        ? SMART_SHELF_MODE.restocking
        : SMART_SHELF_MODE.robotOperation,
    // Keyed by cabinet index, as a string: OPM's `IDictionary<int, …>`.
    cabinetStatuses: Object.fromEntries(
      state.stockSpec.shelfCabinets.map(({ index }) => [
        String(index),
        {
          cabinetIndex: index,
          isCalibrated: true,
          isDrivingMode: false,
          isMoving: false,
          inclinationAngle: 0,
          isConnected: state.shelfConnected,
        },
      ])
    ),
    scannerStatus: state.scannerPresent
      ? {
          isConnected: state.scannerConnected,
          modelName: "SIM-SCANNER",
          latestScannedJanEanCode: null,
          latestScannedAt: null,
          ...state.latestScan,
        }
      : null,
    // A date build, as current Stock Shelf clients report; OPM refuses manual
    // replenishment for anything it cannot read as at least 1.3.1.
    shelfClientVersion: "2026.09.14.1840_simulator",
  }
}
