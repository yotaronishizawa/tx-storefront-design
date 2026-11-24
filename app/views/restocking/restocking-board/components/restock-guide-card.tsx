import { useTranslation } from "react-i18next"

import type { Sku } from "~/api/opm/schemas"
import type { RestockGuideView } from "~/model/shelf"

import { useGuideWords } from "./use-guide-words"

/** The restock study's "where to put it" on the full board, for whoever runs the session. */
export function RestockGuideCard({
  guide,
  skuById,
}: {
  guide: RestockGuideView
  skuById: Map<string, Sku>
}) {
  const { t } = useTranslation("app")
  const words = useGuideWords(skuById)

  const { target } = guide
  if (!target) {
    return (
      <section className="rounded-lg border-2 border-warning bg-warning-subtle p-3">
        <p className="text-base font-bold text-primary">
          {t("restockGuideNone")}
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-lg border-2 border-success bg-success-subtle p-3">
      <p className="text-base font-bold text-secondary">
        {t("restockGuideTitle")}
      </p>
      <p className="mt-1 text-xl font-bold text-primary">
        {words.place(target.shelf, target.landmark, guide.skuId)}
      </p>
      <p className="mt-1 text-base font-bold text-secondary">
        {t("restockGuideRoom", { count: target.room })}
      </p>
    </section>
  )
}
