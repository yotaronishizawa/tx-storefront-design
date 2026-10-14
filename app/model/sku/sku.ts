import type { Sku } from "~/api/opm/schemas"

export function getSkuName(sku: Sku | undefined): string {
  return sku ? sku.itemName || sku.itemKeyword || sku.id : ""
}

/**
 * Whether the SKU can be picked: it needs a keyword, a name and an EAN.
 *
 * @example isUsableSku({ id: "a", itemKeyword: "cola", itemName: "コーラ", eanCode: "" } as Sku) // false
 */
export function isUsableSku(sku: Sku): boolean {
  return Boolean(sku.itemKeyword && sku.itemName && sku.eanCode)
}

export function getSkuVolume(sku: Sku | undefined): string {
  return sku ? `${sku.volume}ml` : ""
}

/** @example normalizeJanCode(" 4901 234 ") // "4901234" */
export function normalizeJanCode(value: string): string {
  return value.replace(/\s+/g, "")
}

/**
 * Whether a scanned code is a well-formed JAN/EAN-8, UPC-A or JAN/EAN-13 with
 * a correct check digit, by the same rule OPM applies.
 *
 * @example isValidJanCode("4901234567894") // true
 * @example isValidJanCode("4901234567890") // false
 */
export function isValidJanCode(code: string): boolean {
  if (!/^\d+$/.test(code) || /^0+$/.test(code)) {
    return false
  }
  if (code.length !== 8 && code.length !== 12 && code.length !== 13) {
    return false
  }
  const digits = (code.length === 12 ? `0${code}` : code).split("").map(Number)
  const check = digits.pop() ?? 0
  // From the digit nearest the check digit, weights alternate 3, 1, 3…
  const sum = digits
    .reverse()
    .reduce(
      (total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1),
      0
    )
  return (10 - (sum % 10)) % 10 === check
}

export function getSkuJanCode(sku: Sku | undefined): string {
  return normalizeJanCode(sku?.eanCode ?? "")
}

const CUT_PRODUCT_EAN_CODE = "999"

/**
 * A cut product: the robot never stocks it, so it cannot be reserved for display.
 *
 * @example isCutProduct({ eanCode: "999" } as Sku) // true
 */
export function isCutProduct(sku: Sku | undefined): boolean {
  return sku?.eanCode === CUT_PRODUCT_EAN_CODE
}

export function getSkuImageUrl(sku: Sku | undefined): string {
  return sku?.images[0] ?? ""
}

const PLACEHOLDER_PHRASES = [
  "unused",
  "un used",
  "not used",
  "notused",
  "empty lane",
  "empty slot",
]

/**
 * The stand-in SKUs OPM puts in lanes that hold no real drink.
 *
 * @example isPlaceholderSku("unused-lane") // true
 */
export function isPlaceholderSku(skuId: string, sku?: Sku): boolean {
  const searchableText = normalizeSkuText(
    [skuId, getSkuName(sku), getSkuImageUrl(sku), sku?.itemKeyword].join(" ")
  )
  const skuName = normalizeSkuText(getSkuName(sku))

  return (
    PLACEHOLDER_PHRASES.some((phrase) => searchableText.includes(phrase)) ||
    /\bgeneral\s*\d*\b/.test(skuName) ||
    /\bgeneric\s*(sku|slot|lane|drink)?\b/.test(searchableText)
  )
}

function normalizeSkuText(value: unknown): string {
  return safelyDecodeURIComponent(String(value ?? ""))
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/%20|%2f|%2d/gi, " ")
}

function safelyDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}
