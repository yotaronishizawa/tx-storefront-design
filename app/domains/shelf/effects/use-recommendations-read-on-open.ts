import { useEffect } from "react"

import { getSkuRecommendations } from "~/api/opm"
import { useSession } from "~/domains/session"
import {
  useSelectedStoreId,
  useStoreDataSettled,
} from "~/domains/store-selection"

import { readShelfState } from "../shelf-store"

/**
 * Reads the list again when the recommendations page opens, so a save cannot
 * overwrite another tablet's change. While the store is still loading, that
 * load reads it instead. A failed read keeps what is shown.
 */
export function useRecommendationsReadOnOpen() {
  const session = useSession()
  const storeId = useSelectedStoreId()
  const settled = useStoreDataSettled()

  useEffect(() => {
    if (!session || !storeId || !settled) {
      return
    }
    let open = true
    const shelf = readShelfState()
    shelf.setRecommendationCountsReading(true)

    getSkuRecommendations(storeId, session.token)
      .then((counts) => {
        if (open && counts) {
          readShelfState().setRecommendationCounts(counts, storeId)
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (open) {
          readShelfState().setRecommendationCountsReading(false)
        }
      })

    return () => {
      open = false
      readShelfState().setRecommendationCountsReading(false)
    }
  }, [session, settled, storeId])
}
