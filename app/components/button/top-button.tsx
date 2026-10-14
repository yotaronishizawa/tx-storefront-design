import type { ReactNode } from "react"

import { Button } from "~/core"
import { cn } from "~/utils/cn"

export function TopButton({
  active,
  children,
  onClick,
}: {
  active?: boolean
  children: ReactNode
  onClick: () => void
}) {
  return (
    <Button
      variant="unstyled"
      size="unstyled"
      className={cn(
        "inline-flex h-10 shrink-0 items-center gap-2 rounded-full border bg-default px-3 text-xs font-bold text-primary transition [&_svg]:size-3.5",
        active ? "ring-2 ring-primary" : "active:bg-muted"
      )}
      type="button"
      onClick={onClick}
    >
      {children}
    </Button>
  )
}
