import type { ComponentProps } from "react"

import { useTranslation } from "react-i18next"

import type { Sku } from "~/api/opm/schemas"
import { Button } from "~/core"
import type { RestockEntryItemView } from "~/model/shelf"

import { RestockEntryScreen } from "../restocking-board/components/restock-entry-screen"

/**
 * The drinks-to-restock list opened from Home, to prepare before going in.
 * The same list as restocking shows, but only to look: no board (it offers
 * removals) and no scanning. The one way on is the same restock as on Home.
 */
export function StockListView({
  items,
  takeOutItems,
  skuById,
  onRestock,
}: {
  items: RestockEntryItemView[]
  takeOutItems?: ComponentProps<typeof RestockEntryScreen>["takeOutItems"]
  skuById: Map<string, Sku>
  onRestock: () => void
}) {
  const { t } = useTranslation("app")
  return (
    <RestockEntryScreen
      actions={
        <Button size="lg" type="button" onClick={onRestock}>
          {t("workflow.home.restock")}
        </Button>
      }
      errorCount={0}
      items={items}
      takeOutItems={takeOutItems}
      restocking={false}
      skuById={skuById}
      onFixErrors={() => {}}
      onShowGuide={() => {}}
    />
  )
}
