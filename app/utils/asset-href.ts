export const APP_BASE_PATH = import.meta.env.BASE_URL || "/"

/** A `public/` file's URL under the deployed base path. */
export function assetHref(path: string) {
  return `${APP_BASE_PATH}${path.replace(/^\/+/, "")}`
}
