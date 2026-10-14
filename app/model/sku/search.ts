import type { Sku } from "~/api/opm/schemas"

import { getLocalizedSkuName } from "./localized-name"
import { getSkuName } from "./sku"

// Hiragana (ぁ–ゖ, ゝ, ゞ) sits 0x60 below its katakana.
const HIRAGANA = /[\u3041-\u3096\u309d\u309e]/g
const KANA_OFFSET = 0x60

// Ignores width, case and kana type.
function normalizeSearchText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(HIRAGANA, (char) =>
      String.fromCharCode(char.charCodeAt(0) + KANA_OFFSET)
    )
}

/**
 * Every whitespace-separated term must appear in the SKU's id, names, keyword or JAN.
 *
 * @example matchesSkuSearch({ id: "a", itemName: "緑茶 / Green Tea", eanCode: "4901" } as Sku, "green 4901", "en") // true
 * @example matchesSkuSearch({ id: "b", itemName: "コーラ" } as Sku, "こーら", "ja") // true
 */
export function matchesSkuSearch(
  sku: Sku | undefined,
  search: string,
  language: string,
  skuId = sku?.id ?? ""
): boolean {
  const terms = normalizeSearchText(search).split(/\s+/).filter(Boolean)
  if (terms.length === 0) {
    return true
  }

  const text = normalizeSearchText(
    [
      skuId,
      getSkuName(sku),
      getLocalizedSkuName(sku, language),
      sku?.itemKeyword,
      sku?.eanCode,
    ].join(" ")
  )
  return terms.every((term) => text.includes(term))
}
