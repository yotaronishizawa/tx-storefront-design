import { useEffect, useState } from "react"

import type { LayoutCabinet } from "~/model/shelf"

// The picked cabinet, falling back to the first; jumps to `follow` when it or `signal` changes.
export function useActiveCabinet(
  board: LayoutCabinet[],
  follow?: number,
  signal = 0
) {
  const [picked, setPicked] = useState<number | null>(null)

  useEffect(() => {
    if (follow !== undefined) {
      setPicked(follow)
    }
  }, [follow, signal])

  const cabinet = board.find((item) => item.cabinet === picked) ?? board[0]

  return [cabinet, setPicked] as const
}
