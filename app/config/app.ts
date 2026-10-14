import { APP_VERSION } from "./env"

// The version is the git tag (`v<YYYY.MM.DD>.<n>-<sha>[-stg]`); its environment suffix becomes a separate label.
const ENVIRONMENT_SUFFIX = /-(stg|dev|prod)$/i

function parseAppVersion(version: string) {
  return {
    environmentLabel: ENVIRONMENT_SUFFIX.exec(version)?.[1].toUpperCase() ?? "",
    version: version.replace(ENVIRONMENT_SUFFIX, ""),
  }
}

const parsedAppVersion = parseAppVersion(APP_VERSION)

/** Production hides error details from operators; staging and dev show them. */
export const IS_PRODUCTION = import.meta.env.MODE === "prod"

export const APP_ENVIRONMENT_LABEL = parsedAppVersion.environmentLabel
export const APP_VERSION_LABEL = parsedAppVersion.version
export const MANUAL_URL =
  "https://drive.google.com/drive/folders/1ffYalC9Olb6uStblNqhDVKJ3Prme9Y0J?usp=share_link"
export const OPERATIONS_CENTER_PHONE = "0120-111-364"
