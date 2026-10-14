export const VIDEO_TUTORIAL_CATEGORIES = [
  "None",
  "InitialPage",
  "InitialPage_DisplayShelf",
  "InitialPage_StockShelf",
  "RobotControl",
  "ManualReplenishment",
  "DisplayLayout",
  "UpdateShelves",
  "Confirmation",
  "Modification",
  "Target",
  "JanCodeScanning",
  "Memo",
  "RobotSelection",
  "ManualAndFAQ",
  "TaskList",
  "Settings",
] as const

export type VideoTutorialCategory = (typeof VIDEO_TUTORIAL_CATEGORIES)[number]

export type VideoTutorial = {
  id: string
  title: string
  videoUrl: string
}

/** Which video a screen category opens on. */
export type VideoTutorialPanel = {
  panelType: VideoTutorialCategory
  videoKey: string
}

// The built-in catalog, used when the remote one is unset or unreadable.
export const FALLBACK_VIDEO_TUTORIAL_PANELS: VideoTutorialPanel[] = [
  { panelType: "InitialPage", videoKey: "vid_system_overview" },
  {
    panelType: "InitialPage_DisplayShelf",
    videoKey: "vid_shelf_layout_change_procedure",
  },
  {
    panelType: "InitialPage_StockShelf",
    videoKey: "vid_replenishment_safety_precautions",
  },
  {
    panelType: "UpdateShelves",
    videoKey: "vid_shelf_layout_change_procedure",
  },
  {
    panelType: "DisplayLayout",
    videoKey: "vid_robot_curtain_opening_and_closing",
  },
  {
    panelType: "Modification",
    videoKey: "vid_replenishment_ui_screen_guide",
  },
  {
    panelType: "Target",
    videoKey: "vid_inventory_required_stock_quantity_edit",
  },
  {
    panelType: "ManualReplenishment",
    videoKey: "vid_manual_replenishment_mode_usage",
  },
  {
    panelType: "RobotControl",
    videoKey: "vid_robot_operation_stop_and_resume",
  },
  {
    panelType: "JanCodeScanning",
    videoKey: "vid_scanner_troubleshooting_guide",
  },
  {
    panelType: "ManualAndFAQ",
    videoKey: "vid_system_setup_preparation",
  },
  {
    panelType: "Settings",
    videoKey: "vid_system_setup_preparation",
  },
]

export const FALLBACK_VIDEO_TUTORIALS: VideoTutorial[] = [
  {
    id: "vid_system_overview",
    title: "品出し・在庫管理ロボットシステム概要",
    videoUrl:
      "https://ststoreappcrossenv001.blob.core.windows.net/tutorial/品出し・在庫管理ロボットシステム概要2.mp4",
  },
  {
    id: "vid_robot_operation_stop_and_resume",
    title: "ロボットの停止・再開方法",
    videoUrl:
      "https://ststoreappcrossenv001.blob.core.windows.net/tutorial/ロボットの停止・再開方法2.mp4",
  },
  {
    id: "vid_replenishment_ui_screen_guide",
    title: "スマートシェルフの補充画面の見方",
    videoUrl:
      "https://ststoreappcrossenv001.blob.core.windows.net/tutorial/スマートシェルフ補充画面の見方.mp4",
  },
  {
    id: "vid_replenishment_procedure_and_data_correction",
    title: "スマートシェルフへの補充手順と補充データ修正方法",
    videoUrl:
      "https://ststoreappcrossenv001.blob.core.windows.net/tutorial/スマートシェルフ補充手順と補充データ修正方法.mp4",
  },
  {
    id: "vid_replenishment_safety_precautions",
    title: "スマートシェルフへの補充時の注意事項・禁止事項",
    videoUrl:
      "https://ststoreappcrossenv001.blob.core.windows.net/tutorial/スマートシェルフ飲料補充時の注意・禁止事項.mp4",
  },
  {
    id: "vid_shelf_layout_change_procedure",
    title: "売場棚割の変更方法",
    videoUrl:
      "https://ststoreappcrossenv001.blob.core.windows.net/tutorial/売場棚割の変更方法.mp4",
  },
  {
    id: "vid_robot_stop_position_customization",
    title: "ロボット上下移動機能の使い方",
    videoUrl:
      "https://ststoreappcrossenv001.blob.core.windows.net/tutorial/ロボット上下移動機能の使い方.mp4",
  },
  {
    id: "vid_robot_curtain_opening_and_closing",
    title: "カーテンの操作方法",
    videoUrl:
      "https://ststoreappcrossenv001.blob.core.windows.net/tutorial/カーテンの操作方法.mp4",
  },
  {
    id: "vid_inventory_required_stock_quantity_edit",
    title: "必要在庫数の変更方法",
    videoUrl:
      "https://ststoreappcrossenv001.blob.core.windows.net/tutorial/必要在庫数の変更方法.mp4",
  },
  {
    id: "vid_display_reservation_function_usage",
    title: "陳列予約機能の使い方",
    videoUrl:
      "https://ststoreappcrossenv001.blob.core.windows.net/tutorial/陳列予約機能の使い方0305_finalfinal.mp4",
  },
  {
    id: "vid_scanner_troubleshooting_guide",
    title: "スキャナのトラブル対応",
    videoUrl:
      "https://ststoreappcrossenv001.blob.core.windows.net/tutorial/バーコードリーダーのトラブル対応0305_final.mp4",
  },
  {
    id: "vid_system_setup_preparation",
    title: "導入までの事前準備",
    videoUrl:
      "https://ststoreappcrossenv001.blob.core.windows.net/tutorial/ロボット導入日までの事前準備0305_final.mp4",
  },
  {
    id: "vid_manual_replenishment_mode_usage",
    title: "品出しモード",
    videoUrl:
      "https://ststoreappcrossenv001.blob.core.windows.net/tutorial/手で在庫棚から品出し機能の使い方_0607_2.mp4",
  },
]
