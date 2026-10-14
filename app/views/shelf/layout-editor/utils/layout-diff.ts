import type { LayoutCabinet } from "~/model/shelf"
import { layoutSignature } from "~/model/shelf"

export type FaceChange = "added" | "changed" | "removed"

/** Preserve identity: deleting a face must not make its neighbour look replaced. */
export function getLayoutDiff(before: LayoutCabinet[], after: LayoutCabinet[]) {
  const beforeCells = before.flatMap((cabinet) =>
    cabinet.rows.flatMap((row) => row.cells)
  )
  const afterCells = after.flatMap((cabinet) =>
    cabinet.rows.flatMap((row) => row.cells)
  )
  const beforeById = new Map(beforeCells.map((cell) => [cell.id, cell]))
  const afterById = new Map(afterCells.map((cell) => [cell.id, cell]))
  const changes = new Map<string, FaceChange>()
  for (const cell of beforeCells) {
    const next = afterById.get(cell.id)
    if (!next) changes.set(cell.id, "removed")
    else if (
      cell.location &&
      next.location &&
      layoutSignature([cell.location]) !== layoutSignature([next.location])
    )
      changes.set(cell.id, "changed")
  }
  for (const cell of afterCells)
    if (!beforeById.has(cell.id)) changes.set(cell.id, "added")
  const rows = new Map<
    string,
    { cabinet: number; row: number; count: number }
  >()
  for (const [id] of changes) {
    const cell = afterById.get(id) ?? beforeById.get(id)
    if (!cell) continue
    const key = `${cell.cabinet}:${cell.row}`
    const existing = rows.get(key)
    rows.set(key, {
      cabinet: cell.cabinet,
      row: cell.row,
      count: (existing?.count ?? 0) + 1,
    })
  }
  return {
    changes,
    rows: [...rows.values()],
    removed: [...changes.values()].filter((change) => change === "removed")
      .length,
  }
}
