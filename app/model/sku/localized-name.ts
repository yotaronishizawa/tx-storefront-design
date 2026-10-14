import type { Sku, Store } from "~/api/opm/schemas"

import { getSkuName } from "./sku"

/**
 * The Japanese name in `ja`, the English one in every other language, each
 * falling back to the other when missing.
 *
 * @example pickLocalizedName("en", "緑茶", "Green Tea") // "Green Tea"
 * @example pickLocalizedName("ja", "", "Green Tea") // "Green Tea"
 */
function pickLocalizedName(
  language: string,
  japaneseName: string,
  englishName: string
): string {
  return language === "ja"
    ? japaneseName || englishName
    : englishName || japaneseName
}

/**
 * @example getLocalizedStoreName({ id: "S1", storeName: "渋谷店", storeNameEn: "Shibuya" } as Store, "en") // "Shibuya"
 */
export function getLocalizedStoreName(store: Store, language: string): string {
  return (
    pickLocalizedName(language, store.storeName, store.storeNameEn) || store.id
  )
}

/**
 * OPM has no English SKU field: `itemName` carries both as `"日本語 / English"`.
 *
 * @example getLocalizedSkuName({ id: "a", itemName: "緑茶 / Green Tea" } as Sku, "en") // "Green Tea"
 */
export function getLocalizedSkuName(
  sku: Sku | undefined,
  language: string
): string {
  const name = getSkuName(sku)
  const separator = name.indexOf("/")
  if (separator < 0) {
    return name
  }

  return (
    pickLocalizedName(
      language,
      name.slice(0, separator).trim(),
      name.slice(separator + 1).trim()
    ) || name
  )
}
