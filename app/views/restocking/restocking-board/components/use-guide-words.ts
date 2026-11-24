import { useTranslation } from "react-i18next"

import type { Sku } from "~/api/opm/schemas"
import type { GuideLandmark } from "~/model/shelf"
import { getLocalizedSkuName } from "~/model/sku"

type ShelfPosition = "center" | "left" | "right" | ""

/** The guide's words: a drink by name, a lane by what to find it by. */
export function useGuideWords(skuById: Map<string, Sku>) {
  const { t, i18n } = useTranslation("app")
  const name = (skuId: string) =>
    getLocalizedSkuName(skuById.get(skuId), i18n.language) || skuId

  function landmark(item: GuideLandmark, skuId: string): string {
    switch (item.kind) {
      case "same-lane":
        return t("restockGuideSameLane", { sku: name(skuId) })
      case "beside":
        if (item.distance > 1) {
          return t(
            item.side === "right"
              ? "restockGuideRightOfBy"
              : "restockGuideLeftOfBy",
            { count: item.distance, sku: name(item.skuId) }
          )
        }
        return t(
          item.side === "right" ? "restockGuideRightOf" : "restockGuideLeftOf",
          { sku: name(item.skuId) }
        )
      case "edge":
        return t(
          item.side === "left"
            ? "restockGuideLeftEdge"
            : "restockGuideRightEdge"
        )
      case "from-left":
        return t("restockGuideFromLeft", { count: item.count })
      case "from-right":
        return t("restockGuideFromRight", { count: item.count })
    }
  }

  /** "右の棚"; empty with a single cabinet. */
  function shelf(position: ShelfPosition): string {
    switch (position) {
      case "left":
        return t("restockGuideShelfLeft")
      case "center":
        return t("restockGuideShelfCenter")
      case "right":
        return t("restockGuideShelfRight")
      default:
        return ""
    }
  }

  /** "右の棚、コーラのレーン", or the landmark alone with a single cabinet. */
  function place(
    position: ShelfPosition,
    item: GuideLandmark,
    skuId: string
  ): string {
    const where = landmark(item, skuId)
    return position
      ? t("restockGuidePlace", { landmark: where, shelf: shelf(position) })
      : where
  }

  return { landmark, name, place, shelf }
}
