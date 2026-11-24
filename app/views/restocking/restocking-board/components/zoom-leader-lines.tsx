import { useEffect, useState, type RefObject } from "react"

type Box = { bottom: number; left: number; right: number; top: number }

/**
 * Two dashed lines from the framed lanes on the shelf front to the zoom of
 * them, as a drawing ties a detail to where it came from. Both ends are found
 * by `data-zoom-source` and `data-zoom-target` inside `container`, which must
 * be positioned.
 */
export function ZoomLeaderLines({
  container,
  laneKey,
}: {
  container: RefObject<HTMLElement | null>
  laneKey: string
}) {
  const [ends, setEnds] = useState<{ source: Box; target: Box } | null>(null)

  useEffect(() => {
    const root = container.current
    if (!root) {
      return
    }
    const observed = new Set<Element>()
    // Finds both ends afresh each time: the elements are replaced as the
    // shelf redraws, not only when the lane changes.
    const measure = () => {
      const source = root.querySelector<HTMLElement>("[data-zoom-source]")
      const target = root.querySelector<HTMLElement>("[data-zoom-target]")
      if (!source || !target) {
        setEnds(null)
        return
      }
      for (const element of [source, target]) {
        if (!observed.has(element)) {
          observed.add(element)
          resizes.observe(element)
        }
      }
      const origin = root.getBoundingClientRect()
      const box = (element: HTMLElement): Box => {
        const rect = element.getBoundingClientRect()
        return {
          bottom: rect.bottom - origin.top,
          left: rect.left - origin.left,
          right: rect.right - origin.left,
          top: rect.top - origin.top,
        }
      }
      setEnds({ source: box(source), target: box(target) })
    }
    // Fires once on observe, so the lines draw straight away.
    const resizes = new ResizeObserver(measure)
    resizes.observe(root)
    const changes = new MutationObserver(measure)
    changes.observe(root, { childList: true, subtree: true })
    return () => {
      resizes.disconnect()
      changes.disconnect()
    }
  }, [container, laneKey])

  if (!ends) {
    return null
  }
  // The source frame's outline is drawn inside its edge.
  const outset = 0
  const { source, target } = ends
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 size-full overflow-visible"
    >
      <g
        fill="none"
        stroke="var(--border-color-strong)"
        strokeDasharray="10 6"
        strokeWidth={3}
      >
        <line
          x1={source.right + outset}
          x2={target.left}
          y1={source.top - outset}
          y2={target.top}
        />
        <line
          x1={source.right + outset}
          x2={target.left}
          y1={source.bottom + outset}
          y2={target.bottom}
        />
      </g>
    </svg>
  )
}
