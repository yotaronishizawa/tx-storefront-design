import type { ReactNode } from "react"

import { Button } from "~/core"
import { cn } from "~/utils/cn"

export function HomeActionTile({
  busy,
  disabled,
  icon,
  label,
  primary,
  short,
  status,
  onClick,
}: {
  busy?: boolean
  disabled?: boolean
  icon: ReactNode
  label: string
  primary?: boolean
  short?: boolean
  /** An ongoing task this tile leads to, shown as a pill in the corner. */
  status?: string
  onClick: () => void
}) {
  return (
    <Button
      variant="unstyled"
      size="unstyled"
      className={cn(
        "relative flex h-full min-h-0 min-w-0 items-center justify-center gap-3 rounded-md border-2 px-3 text-center text-xl/tight font-bold tracking-normal transition disabled:cursor-not-allowed disabled:border-default disabled:bg-muted disabled:text-disabled [&_svg]:size-7 [&_svg]:shrink-0 [@media(max-height:900px)]:gap-2 [@media(max-height:900px)]:px-2 [@media(max-height:900px)]:text-lg [@media(max-height:900px)]:[&_svg]:size-6",
        short ? "py-2" : "py-3",
        primary
          ? "border-primary bg-primary text-on-primary active:border-primary-pressed active:bg-primary-pressed"
          : "border-default bg-default active:bg-muted"
      )}
      busy={busy}
      disabled={disabled}
      icon={icon}
      type="button"
      onClick={onClick}
    >
      <span className="min-w-0 whitespace-normal">{label}</span>
      {status && (
        <span className="absolute top-2 right-2 inline-flex items-center gap-1.5 rounded-full bg-inverse px-2.5 py-1 text-xs font-bold text-inverse">
          <span className="size-2 animate-pulse rounded-full bg-success" />
          {status}
        </span>
      )}
    </Button>
  )
}
