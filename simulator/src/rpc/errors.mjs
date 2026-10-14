/*
 * OPM's error enums, by value, for the RPCs that report failures in their
 * answer. Paths are in `txoperationmanager`, under `TXOperationShared/Package/Scripts/`:
 * `Operation/Gateways/…` or `JobManager/Entities/…`.
 * OPM sends every value as a number.
 */

const SHELF_ERRORS = [
  "ShelvesError",
  "ShelvesAngleCalibrationError",
  "ShelvesInclinationInProgress",
  "ShelfClientTimeout",
  "ShelvesInclinationFailure",
]

// `Operation/Gateways/RpcGateway.Inventory.cs:177` StartRestockingErrors
export const START_RESTOCKING_ERRORS = [
  "None",
  "ServerError",
  "RobotNotInRestPosition",
  ...SHELF_ERRORS,
  "StockLayoutHasErrors",
  "ManualReplenishmentInProgress",
  "TeleoperationInProgress",
  "Capture3dInProgress",
  "WeightStabilizationTimeout",
  "StopRobotOperationError",
  "PreconditionsUnsatisfied",
]

// `Operation/Gateways/RpcGateway.Inventory.cs:306` EndRestockingErrors
export const END_RESTOCKING_ERRORS = [
  "None",
  "ServerError",
  "RestockingTaskNotFound",
  "RestockingTaskNotInProgress",
  ...SHELF_ERRORS,
  "StockLayoutHasErrors",
]

// `Operation/Gateways/RpcGateway.Inventory.cs:291` PauseRestockingErrors
export const PAUSE_RESTOCKING_ERRORS = [
  "None",
  "ServerError",
  "RestockingTaskNotFound",
  "RestockingTaskNotInProgress",
]

// `Operation/Gateways/RpcGateway.Inventory.cs:331` StartRobotOperationErrors
export const START_ROBOT_OPERATION_ERRORS = [
  "None",
  "ServerError",
  "RobotError",
  "ShelvesError",
  "ShelvesAngleCalibrationError",
  "ShelvesInclinationInProgress",
  "AnnotationTaskInProgress",
  "ShelfClientTimeout",
  "ShelvesInclinationFailure",
  "RestockingInProgress",
  "TeleoperationInProgress",
  "RobotNotLinkedToStore",
  "ManualReplenishmentInProgress",
  "UnableToUpdateRobotOperationMode",
]

// `Operation/Gateways/RpcGateway.Inventory.cs:356` StopRobotOperationErrors
export const STOP_ROBOT_OPERATION_ERRORS = [
  "None",
  "RateLimited",
  "ServerError",
  "ShelvesError",
  "ShelvesAngleCalibrationError",
  "ShelvesInclinationInProgress",
  "AlreadyStopping",
  "WaitForRestPositionTimeout",
  "RobotCannotBeStopped",
  "RobotNotLinkedToStore",
  "TeleoperationInProgress",
  "Capture3dInProgress",
]

// `Operation/Gateways/RpcGateway.Inventory.cs:220` StartManualReplenishmentErrors
export const START_MANUAL_REPLENISHMENT_ERRORS = [
  "None",
  "ServerError",
  "WaitingForRestPositionTimeout",
  ...SHELF_ERRORS,
  "StockLayoutHasErrors",
  "RestockingTaskOpen",
  "AnnotationTaskOpen",
  "StopRobotOperationError",
  "FailedToOpenCurtains",
  "IncompatibleShelfClientVersion",
  "PreconditionsUnsatisfied",
]

// `Operation/Gateways/RpcGateway.Inventory.cs:262` EndManualReplenishmentErrors
export const END_MANUAL_REPLENISHMENT_ERRORS = [
  "None",
  "ServerError",
  "ManualReplenishmentTaskNotFound",
  "ManualReplenishmentTaskNotInProgress",
  ...SHELF_ERRORS,
  "StockLayoutHasErrors",
  "StartRobotOperationError",
  "FailedToCloseCurtains",
  "UnstableWeights",
]

// `Operation/Gateways/RpcGateway.Inventory.cs:158` RemoveSkusFromStockResult
export const REMOVE_SKUS_FROM_STOCK_RESULTS = [
  "Success",
  "ServerError",
  "InvalidParameters",
  "LocationNotFound",
  "DifferentSkuId",
  "PnpInProgress",
  "RestockingInProgress",
  "RobotMoving",
  "JobQueueNotEmpty",
]

// `Operation/Gateways/SmartShelves/RpcGateway.StockSkusChangesSubscription.cs:233`
export const SUBSCRIBE_STOCK_SKU_CHANGES_ERRORS = [
  "None",
  "ServerError",
  "ShelfClientTimeout",
]

// `Operation/Gateways/SmartShelves/RpcGateway.StockSkusChangesSubscription.cs:352`
export const SET_CURRENT_RESTOCKING_SKU_ERRORS = [
  "None",
  "ServerError",
  "ShelvesError",
  "SkuDoesNotExist",
  "NoRestockTask",
  "ShelfClientTimeout",
  "WeightStabilizationTimeout",
  "StockHasErrors",
]

// `JobManager/Entities/PrepareManualPnpJobErrorCode.cs:6`
export const PREPARE_MANUAL_PNP_JOB_ERRORS = [
  "None",
  "StoreNotFound",
  "DestinationNotFound",
  "SkuNotFound",
  "SkuIsIgnored",
  "DestinationNotAvailable",
  "NoValidSourceFound",
  "ManualPnpJobSituationNull",
  "ManualPnpJobSituationNotAvailableToNewManualJob",
  "NoSourceWithSkuFound",
  "AllSourceWithSkuBlacklisted",
  "AllSourceWithSkuNotAvailable",
  "AllSourceWithSkuPendingPnp",
  "AllSourceWithSkuEmpty",
  "AllSourceWithSkuEmptySkuIdArray",
  "AllSourceWithSkuBlocked",
  "AllSourceWithSkuWillHaveNotEnoughSku",
]

// `JobManager/Entities/InvalidPnpJobContextReason.cs:6`
export const INVALID_PNP_JOB_CONTEXT_REASONS = [
  "None",
  "JobContextNotFound",
  "JobContextNull",
  "SkuNull",
  "DestinationsUnset",
  "SourcesUnset",
  "InvalidMaxIteration",
  "PnpJobResultNotFound",
  "StoreNotFound",
  "DestinationSkuIdChanged",
  "SourceSkuIdChanged",
  "DestinationNotAvailable",
  "DestinationBlacklisted",
  "SourceNotAvailable",
  "SourceBlacklisted",
  "DestinationFull",
  "SourceEmpty",
  "SmartShelfSkuIdArrayUnset",
  "MaxIterationExceedsSmartShelfAllowedMaxIteration",
  "DestinationBlacklistedDueToOverstock",
  "SkuIgnored",
  "DestinationExceedsJobXRange",
  "SourceExceedsJobXRange",
  "SkuNotFound",
  "DestinationNeedsScan_NeverScanned",
  "DestinationNeedsScan_LastScannedBeforeRestock",
  "DestinationCannotFitEntireDrink",
  "MaxIterationExceedsPredictedSmartShelfAllowedMaxIteration",
  "DestinationNeedsScan_PnpFailed",
]

// `JobManager/Entities/PnpJobContextWarning.cs:4`
export const PNP_JOB_CONTEXT_WARNINGS = {
  0: "DestinationFull",
  1: "DestinationNotAvailable",
  2: "DestinationNeedsScan_ScanResultStale",
  3: "DestinationCannotFitEntireDrink",
  4: "DestinationNeedsScan_NeverScanned",
  5: "DestinationNeedsScan_LastScannedBeforeRestock",
  6: "DestinationNeedsScan_PnpFailed",
  200: "SmartShelvesStatusNotFound",
  201: "SmartShelvesStatusStale",
  202: "SmartShelvesNotReady",
  299: "SmartShelfClientNotEnabled",
}

// `Operation/Gateways/RpcGateway.RequestContext.cs:772` StartShelfLayoutResponseError
export const START_SHELF_LAYOUT_ERRORS = {
  0: "None",
  1: "AllocateLayoutError",
  2: "CreateShelfLayoutRequestError",
  3: "CreateLayoutCheckRequestError",
  10: "CabinetsDisabledNotAtFarthestEdges",
  20: "CabinetsToggleStatusInconsistent",
  900: "ValidationError",
}

// `Operation/Entities/RpcResult.cs`: GetSmartShelvesStatus has no enum, only a failed result.
export const SMART_SHELVES_STATUS_ERRORS = ["None", "Unavailable"]

// `Operation/Gateways/StoreApp/HomepageActions/RpcGateway.GetHomepageActions.cs:32` GetHomepageActionsResponse.Errors
export const HOMEPAGE_ACTIONS_ERRORS = ["None", "ServerError"]

// `Operation/Gateways/RpcGateway.RequestContext.cs:835` SkipRestockingResponseError
export const SKIP_RESTOCKING_ERRORS = [
  "None",
  "NoShelfLayoutChangeRequestInProgress",
  "RestockingAlreadyInProgress",
  "StartRobotOperationError",
  "UnableToUpdateRobotOperationMode",
]

// `Operation/Gateways/SmartShelves/RpcGateway.StockSkusChangesSubscription.cs:65` ForceDiscrepancyResolutionErrors
export const FORCE_DISCREPANCY_RESOLUTION_ERRORS = [
  "None",
  "ServerError",
  "ShelfClientTimeout",
  "LocationNotFound",
]
