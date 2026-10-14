import type {
  AnyLocation,
  CabinetShelfLocation,
  OpmInput,
  ShelfSpec,
} from "~/api/opm/schemas"

import { groupDisplayShelfLocations } from "./board"
import type { ShelfLocation } from "./lane-update"

export function hasCurtainControls(spec: ShelfSpec | null): boolean {
  return Boolean(
    spec?.cabinets.some((cabinet) => (cabinet.curtainId ?? 0) !== 0)
  )
}

export function cloneLocation(location: ShelfLocation): ShelfLocation {
  return { ...location }
}

export function setLocationSkuId(
  location: ShelfLocation,
  skuId: string
): ShelfLocation {
  return { ...location, skuId, skuIds: skuId ? [skuId] : [] }
}

export function buildCabinetShelfLocations(
  locations: ShelfLocation[],
  spec: ShelfSpec | null
): OpmInput<CabinetShelfLocation>[] {
  return groupDisplayShelfLocations(locations, spec).map((cabinet) => ({
    cabinetIndex: cabinet.cabinet,
    isChangedRowNumInCabinet: false,
    rows: cabinet.rows.map((row) => ({
      rowNum: row.row,
      // Each location goes back as it arrived, fields the app never read included.
      locations: row.cells.flatMap((cell) =>
        cell.location ? [cell.location as OpmInput<AnyLocation>] : []
      ),
    })),
  }))
}
