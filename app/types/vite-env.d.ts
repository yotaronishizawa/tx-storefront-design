import type { Env } from "../../config/env-schema"

/** Types each `VITE_*` read from the build schema, overriding `vite/client`'s `any` index signature. */
declare global {
  interface ImportMetaEnv extends Env {}
}
