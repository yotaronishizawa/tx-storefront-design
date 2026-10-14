import type { ReactNode } from "react"

import { Button } from "~/core"

export function HeaderActionButton({
  children,
  onClick,
}: {
  children: ReactNode
  onClick: () => void
}) {
  return (
    <Button
      variant="unstyled"
      size="unstyled"
      className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border bg-default px-5 text-sm/tight font-bold text-primary transition active:bg-muted [&_svg]:size-5"
      type="button"
      onClick={onClick}
    >
      {children}
    </Button>
  )
}
