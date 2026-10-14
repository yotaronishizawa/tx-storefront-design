import { useBusyAction } from "~/domains/app-shell"
import {
  useRecommendationCounts,
  useRecommendationCountsReadFailed,
  useRecommendationCountsReading,
  useRecommendationsReadOnOpen,
  useShelfLayoutActions,
  useSkuById,
  useSkus,
} from "~/domains/shelf"
import { useStoreDataSettled } from "~/domains/store-selection"
import { RecommendationListView } from "~/views/restocking/recommendation-list"

export default function RecommendationsPage() {
  useRecommendationsReadOnOpen()
  const recommendationCounts = useRecommendationCounts()
  const recommendationCountsReadFailed = useRecommendationCountsReadFailed()
  const recommendationCountsReading = useRecommendationCountsReading()
  const storeDataSettled = useStoreDataSettled()
  const skus = useSkus()
  const skuById = useSkuById()
  const busyAction = useBusyAction()
  const { reloadRecommendations, saveRecommendations } = useShelfLayoutActions()

  return (
    <RecommendationListView
      busyAction={busyAction}
      loading={!storeDataSettled || recommendationCountsReading}
      readFailed={recommendationCountsReadFailed}
      recommendations={recommendationCounts}
      skuById={skuById}
      skus={skus}
      onReloadRecommendations={reloadRecommendations}
      onSaveRecommendations={saveRecommendations}
    />
  )
}
