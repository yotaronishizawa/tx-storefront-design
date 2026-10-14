/*
 * The generated OPM contract names that code outside `api/` needs. Everything
 * else imports them from `~/api/opm/schemas`, never from `__generated__`, so
 * this list is the whole surface the app depends on.
 */
export {
  RobotOperationMode,
  StockHiccupType,
  UnusedType,
} from "../__generated__/opm-rpc"
export type {
  AnyLocation,
  CabinetShelfLocation,
  DiscrepancyCauseName,
  InvalidPnpJobContextReasonName,
  InvalidSkuReasonName,
  JobResultStatusName,
  OpmInput,
  PnpJobContextWarningName,
  PrepareManualPnpJobErrorCodeName,
  RobotOperationModeName,
  RobotWorkStatusName,
  SetCurrentRestockingSkuErrorsName,
  SmartShelfModesName,
  StartManualReplenishmentErrorsName,
  StartRestockingErrorsName,
  StartRobotOperationErrorsName,
  StopRobotOperationErrorsName,
  TeleopErrorCodeName,
} from "../__generated__/opm-rpc"
