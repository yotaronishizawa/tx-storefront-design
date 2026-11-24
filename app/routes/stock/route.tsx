import { Navigate } from "react-router"

import { ROUTES } from "~/config/routes"
import { refreshRequests } from "~/domains/operations"
import { useRestockEntryPlan, useTakeOutPlan } from "~/domains/restocking"
import { useShelfReadOnOpen, useSkuById } from "~/domains/shelf"
import { useVisibleRefresh } from "~/hooks/use-visible-refresh"
import { StockListView } from "~/views/restocking/stock-list"

import { useOpenRestocking } from "../_hooks/use-open-restocking"

/** What needs restocking, looked at without starting: nothing here stops the robot. */
export default function StockPage() {
  const skuById = useSkuById()
  const openRestocking = useOpenRestocking()
  useVisibleRefresh(refreshRequests)
  useShelfReadOnOpen()
  const items = useRestockEntryPlan()
  const takeOutItems = useTakeOutPlan()

  // The list exists only in the restock study.
  if (!items) return <Navigate replace to={ROUTES.home().pathname} />

  return (
    <StockListView
      items={items}
      takeOutItems={takeOutItems}
      skuById={skuById}
      onRestock={openRestocking}
    />
  )
}
