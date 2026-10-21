import {
  index,
  layout,
  route,
  type RouteConfig,
} from "@react-router/dev/routes"

export default [
  // Wraps every URL, including the splat, so the runtime provider never remounts.
  layout("routes/layout.tsx", [
    route("login", "routes/login/route.tsx"),
    route("design-system", "routes/design-system/route.tsx"),

    layout("routes/protected-layout.tsx", [
      layout("routes/chrome-layout.tsx", [
        index("routes/home/route.tsx"),
        route("display", "routes/display/route.tsx"),
        route("recommendations", "routes/recommendations/route.tsx"),
        route("restocking", "routes/restocking/route.tsx"),
        route("manual", "routes/manual/route.tsx"),
        route("walk-in", "routes/walk-in/route.tsx"),
        route("edit", "routes/edit/route.tsx"),
        route("settings", "routes/settings/route.tsx"),
      ]),
    ]),

    route("*", "routes/not-found/route.tsx"),
  ]),
] satisfies RouteConfig
