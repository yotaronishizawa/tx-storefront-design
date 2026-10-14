import type { ProductOperation } from "~/model/shelf"

export type PendingSameJan = {
  existingSkuId: string
  operation: ProductOperation
}

export type InsertTarget = Omit<
  Extract<ProductOperation, { type: "insert" }>,
  "skuId" | "type"
>
