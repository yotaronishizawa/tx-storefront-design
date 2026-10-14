/**
 * Temporary feature flags: change one and redeploy.
 *
 * The store app reads these from Unity Remote Config, which neither this app
 * nor OPM can reach. Each entry names its Remote Config key, so moving it to a
 * remote source later is a lookup.
 */
export const FEATURES = {
  /**
   * Remove every drink of one SKU from the stock shelf in one action. Off, the
   * operator can still look a SKU up and see where it is stocked.
   *
   * Key: `CanRemoveAllSpecificDrink`.
   */
  canRemoveAllSpecificDrink: false,

  /**
   * The count a SKU starts at when added to the recommendation list.
   *
   * Key: `New Recommendation Count` (falls back to `RECOMMEND_INIT_COUNT`, 8).
   */
  newRecommendationCount: 8,

  /**
   * While a layout change is open, /display offers a "temporary" entry showing
   * the layout as it stood when the change was requested.
   *
   * Key: `new_display_layout_change` (`NewCancelLayoutLogic`).
   */
  temporaryDisplayLayout: false,

  /**
   * After End on /restocking, offer to go straight to manual replenishment:
   * `EndRestocking2` leaves the robot stopped. Off, End always restarts it.
   *
   * Key: `EndRestockingGoToManualReplenishment`.
   */
  // Enabled for this study branch to evaluate the continuous work flow.
  // This does not change Unity Remote Config or production deployment.
  endRestockingGoToManualReplenishment: true,

  /**
   * The dropped-drink claim form, opened from the header. Empty hides the
   * button, which stays hidden until the real URL is known.
   *
   * Key: `DrinkRefundFormURL`.
   */
  drinkRefundFormUrl: "",

  /**
   * The "excluded from the robot" box on /edit, limited to the cabinets OPM's
   * rule lets change. Off, the box is hidden; cabinets OPM already has as
   * excluded are still greyed out and locked.
   *
   * The store app has no Remote Config key for this: it is switched off in
   * code (`ShelfStructureEditUsecase.feature_enabled`).
   */
  cabinetExclusion: true,
} as const
