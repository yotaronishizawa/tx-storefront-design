import { z } from "zod"

import { readShelfLocationsStrict } from "~/api/opm/schemas"
import type { LayoutDraft } from "~/model/shelf"
import {
  readStorage,
  readStorageJson,
  removeStorage,
  writeStorage,
} from "~/utils/local-storage"

/*
 * The layout editor's offline draft, one per store. Read back through the
 * locations schema, so a malformed draft never reaches the board as-is.
 */
const layoutDraftSchema = z.object({
  baseSignature: z.string().catch(""),
  facesChanged: z.boolean().catch(false),
  locations: z.array(z.unknown()),
  needRobotCapture: z.boolean().catch(false),
  savedAt: z.number().catch(0),
})

const draftKey = (storeId: string) =>
  `tx-storefront:display-layout-draft:${storeId}`

export function readLayoutDraft(storeId: string): LayoutDraft | null {
  if (!storeId) {
    return null
  }
  const parsed = layoutDraftSchema.safeParse(readStorageJson(draftKey(storeId)))
  if (!parsed.success || parsed.data.locations.length === 0) return null
  try {
    return {
      ...parsed.data,
      locations: readShelfLocationsStrict(parsed.data.locations),
    }
  } catch {
    return null
  }
}

export function saveLayoutDraft(storeId: string, draft: LayoutDraft): boolean {
  if (!storeId) {
    return false
  }
  const serialized = JSON.stringify(draft)
  writeStorage(draftKey(storeId), serialized)
  return readStorage(draftKey(storeId)) === serialized
}

export function clearLayoutDraft(storeId: string): void {
  removeStorage(draftKey(storeId))
}
