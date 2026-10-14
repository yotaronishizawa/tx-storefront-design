export type RecommendationSortKey =
  | "currentCount"
  | "neededCount"
  | "recommendationCount"

export type RecommendationSort = {
  direction: "ascending" | "descending"
  key: RecommendationSortKey
}
