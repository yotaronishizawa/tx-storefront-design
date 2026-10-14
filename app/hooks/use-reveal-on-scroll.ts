import { useEffect, useState } from "react"

/**
 * Shows `items` one page at a time: another page each time the element given
 * to `setSentinel` scrolls into view. A new `items` array starts again at one page.
 *
 * @example
 * const { visible, setSentinel } = useRevealOnScroll(skus, 48)
 * // render `visible`, then <div ref={setSentinel} /> after it
 */
export function useRevealOnScroll<T>(items: T[], pageSize: number) {
  const [page, setPage] = useState({ items, count: pageSize })
  const [sentinel, setSentinel] = useState<Element | null>(null)
  const count = page.items === items ? page.count : pageSize
  const hasMore = count < items.length

  useEffect(() => {
    if (!sentinel || !hasMore) {
      return
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setPage((current) => ({
          items,
          count:
            (current.items === items ? current.count : pageSize) + pageSize,
        }))
      }
    })
    observer.observe(sentinel)
    return () => observer.disconnect()
    // `count` re-observes after each page: a sentinel still in view fires again.
  }, [count, hasMore, items, pageSize, sentinel])

  return { visible: items.slice(0, count), hasMore, setSentinel }
}
