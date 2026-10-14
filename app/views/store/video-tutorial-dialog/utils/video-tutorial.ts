export type VideoState = "idle" | "loading" | "ready" | "error"

// Catalog titles are Japanese only; a known video reads in the operator's language.
const TITLE_KEY_BY_VIDEO_ID = {
  vid_system_overview: "videoTutorialSystemOverview",
  vid_robot_operation_stop_and_resume: "videoTutorialRobotStopAndResume",
  vid_replenishment_ui_screen_guide: "videoTutorialRestockingScreenGuide",
  vid_replenishment_procedure_and_data_correction:
    "videoTutorialRestockingProcedure",
  vid_replenishment_safety_precautions: "videoTutorialRestockingPrecautions",
  vid_shelf_layout_change_procedure: "videoTutorialLayoutChange",
  vid_robot_stop_position_customization: "videoTutorialRestPosition",
  vid_robot_curtain_opening_and_closing: "videoTutorialCurtains",
  vid_inventory_required_stock_quantity_edit: "videoTutorialRequiredStock",
  vid_display_reservation_function_usage: "videoTutorialDisplayReservation",
  vid_scanner_troubleshooting_guide: "videoTutorialScannerTroubleshooting",
  vid_system_setup_preparation: "videoTutorialSetupPreparation",
  vid_manual_replenishment_mode_usage: "videoTutorialManualReplenishment",
} as const

type VideoTitleKey =
  (typeof TITLE_KEY_BY_VIDEO_ID)[keyof typeof TITLE_KEY_BY_VIDEO_ID]

/**
 * @example getVideoTitleKey("vid_system_overview") // "videoTutorialSystemOverview"
 * @example getVideoTitleKey("vid_unknown") // undefined
 */
export function getVideoTitleKey(videoId: string): VideoTitleKey | undefined {
  if (videoId in TITLE_KEY_BY_VIDEO_ID) {
    return TITLE_KEY_BY_VIDEO_ID[videoId as keyof typeof TITLE_KEY_BY_VIDEO_ID]
  }
  return undefined
}

/**
 * As the store app numbers its list.
 *
 * @example formatTutorialTitle("Scanner troubleshooting", 2) // "3. Scanner troubleshooting"
 */
export function formatTutorialTitle(title: string, index: number) {
  return `${index + 1}. ${title}`
}
