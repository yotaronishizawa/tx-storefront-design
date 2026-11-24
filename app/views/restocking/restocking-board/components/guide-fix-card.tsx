import { CircleAlert } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { Sku } from "~/api/opm/schemas"
import { ProductThumb } from "~/components/product/product-thumb"
import { Button } from "~/core"
import type { LaneErrorSummary } from "~/model/shelf"

/**
 * In place of the scanned drink, on the guide's error side: one request for
 * every kind of error, "make the lane look like this". The record is the
 * truth; the picture is the lane as recorded, front first (the robot always
 * takes the front one, so the order counts). A drink that has to come out
 * is left off the picture, so taking out is the same request. The codes stay
 * small at the end, for a call.
 */
export function GuideFixCard({
  skuById,
  skuIds,
  summary,
  onRecover,
}: {
  skuById: Map<string, Sku>
  /** The lane as recorded, front first. */
  skuIds: string[]
  summary: LaneErrorSummary
  /** Put as the picture and still red: the recovery steps. */
  onRecover: () => void
}) {
  const { t } = useTranslation("app")
  const wanted = skuIds.filter((skuId) => !summary.wrongSkuIds.has(skuId))

  return (
    <div
      className="flex shrink-0 flex-col gap-5 rounded-xl bg-default p-6"
      role="alert"
    >
      <div className="flex gap-4">
        <CircleAlert aria-hidden className="mt-1 size-10 shrink-0 text-error" />
        {/* Japanese breaks between phrases, written into the text. */}
        <p className="text-display/tight font-bold whitespace-pre-line text-primary">
          {wanted.length > 0
            ? t("restockFixMatchPicture")
            : t("restockFixEmpty")}
        </p>
      </div>
      {wanted.length > 0 && (
        <div className="flex items-end gap-3">
          <span className="pb-1 text-lg font-bold text-secondary">
            {t("restockFixFront")}
          </span>
          <ol
            className="grid min-w-0 flex-1 gap-1"
            style={{
              gridTemplateColumns: `repeat(${Math.max(wanted.length, 5)}, minmax(0, 1fr))`,
            }}
          >
            {wanted.map((skuId, index) => (
              <li
                // The same drink can stand twice; its place tells them apart.
                key={`${index}-${skuId}`}
                className="flex flex-col items-center gap-1"
              >
                <span className="text-lg font-bold text-secondary">
                  {index + 1}
                </span>
                <ProductThumb
                  className="h-20 w-full"
                  sku={skuById.get(skuId)}
                />
              </li>
            ))}
          </ol>
          <span className="pb-1 text-lg font-bold text-secondary">
            {t("restockFixBack")}
          </span>
        </div>
      )}
      {/* After the picture, the way on if it does not put the lane right:
          asked in their words, across the card from the way back, so it is
          never taken for a way out. */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="text-lg text-secondary">
          {summary.details
            .map((detail) => t("laneErrorCode", { code: detail.code }))
            .join("　")}
        </p>
        <p className="ml-auto flex items-baseline gap-3 text-lg text-secondary">
          {t("restockRecoveryAsk")}
          <Button
            className="text-xl font-bold text-primary underline underline-offset-4"
            size="unstyled"
            type="button"
            variant="unstyled"
            onClick={onRecover}
          >
            {t("restockRecoveryStart")}
          </Button>
        </p>
      </div>
    </div>
  )
}
