import "i18next"

import type app from "../locales/app/en.json"
import type common from "../locales/common/en.json"

/**
 * Types `t()` off the English bundles, so an unknown key is a compile error.
 * Never name this after a sibling `.ts` module: TypeScript would treat it as
 * that module's declaration file and silently drop it.
 */
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common"
    fallbackNS: "common"
    resources: {
      app: typeof app
      common: typeof common
    }
    strictKeyChecks: true
  }
}
