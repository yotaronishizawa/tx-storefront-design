import type { ReactNode } from "react"

import { Button } from "~/core"

export function HomeMiniButton({
  busy,
  disabled,
  icon,
  label,
  onClick,
}: {
  busy?: boolean
  disabled?: boolean
  icon?: ReactNode
  label: string
  onClick?: () => void
}) {
  return (
    <Button
      variant="unstyled"
      size="unstyled"
      className="flex h-full min-h-0 min-w-0 items-center justify-center gap-2 rounded-md border-2 border-default bg-default px-2 text-center text-base/tight font-bold tracking-normal whitespace-normal transition active:bg-muted disabled:cursor-not-allowed disabled:bg-muted disabled:text-disabled [&_svg]:size-6 [&_svg]:shrink-0 [@media(max-height:900px)]:gap-1 [@media(max-height:900px)]:text-sm [@media(max-height:900px)]:[&_svg]:size-5"
      busy={busy}
      disabled={disabled}
      icon={icon}
      type="button"
      onClick={onClick}
    >
      <span className="min-w-0">{label}</span>
    </Button>
  )
}
