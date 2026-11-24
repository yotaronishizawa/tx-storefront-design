import type { ReactNode } from "react"

/**
 * The walk-in screen's right-hand card: a title (with something small beside
 * it), a picture in the middle with a short line under it, and what to do
 * along the bottom. Moving the robot up or down and the restock start's
 * steps share it, so the two screens read as one.
 */
export function WalkInCard({
  aside,
  caption,
  children,
  footer,
  title,
}: {
  /** Beside the title, at its right: a step marker, say. */
  aside?: ReactNode
  /** The short line under the picture. */
  caption?: ReactNode
  /** The picture. */
  children: ReactNode
  footer?: ReactNode
  title: ReactNode
}) {
  return (
    <section className="flex min-h-0 flex-col rounded-xl bg-default p-6">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-[1.875rem]/tight font-bold">{title}</h2>
        {aside}
      </div>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 py-4">
        {children}
        {caption}
      </div>
      {footer && <div className="grid gap-3">{footer}</div>}
    </section>
  )
}
