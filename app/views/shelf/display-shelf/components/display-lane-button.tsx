import type { Sku } from "~/api/opm/schemas"
import { LaneTile } from "~/components/shelf/lane-tile"
import type { LayoutCell } from "~/model/shelf"

function getLaneState(changed?: boolean, selected?: boolean) {
  if (changed && selected) {
    return "diff-selected"
  }
  if (changed) {
    return "diff"
  }
  if (selected) {
    return "selected"
  }
  return "idle"
}

export function DisplayLaneButton({
  cell,
  changed,
  selected,
  skuById,
  onClick,
  onDetail,
}: {
  cell: LayoutCell
  changed?: boolean
  selected?: boolean
  skuById: Map<string, Sku>
  onClick: () => void
  onDetail: () => void
}) {
  return (
    <LaneTile
      cell={cell}
      disabled={cell.isEmpty}
      skuById={skuById}
      state={getLaneState(changed, selected)}
      onClick={onClick}
      onDoubleClick={onDetail}
    />
  )
}
