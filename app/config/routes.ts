/** Every in-app URL. Basename-free: React Router prepends the basename itself. */
export const ROUTES = {
  home: () => ({ pathname: "/" as const }),
  login: () => ({ pathname: "/login" as const }),
  display: () => ({ pathname: "/display" as const }),
  recommendations: () => ({ pathname: "/recommendations" as const }),
  restocking: () => ({ pathname: "/restocking" as const }),
  restockStart: () => ({ pathname: "/restocking/start" as const }),
  stock: () => ({ pathname: "/stock" as const }),
  manual: () => ({ pathname: "/manual" as const }),
  edit: () => ({ pathname: "/edit" as const }),
  walkIn: () => ({ pathname: "/walk-in" as const }),
  settings: () => ({ pathname: "/settings" as const }),
  workReport: () => ({ pathname: "/work-report" as const }),
}
