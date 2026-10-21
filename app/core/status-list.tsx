import type { ReactNode } from "react"

import { Circle, CircleAlert, CircleCheck, Loader2 } from "lucide-react"

import { cn } from "~/utils/cn"

export type StatusListStatus = "pending" | "running" | "done" | "failed"

const ICON: Record<
  StatusListStatus,
  { Icon: typeof Circle; className: string }
> = {
  pending: { Icon: Circle, className: "text-disabled" },
  running: { Icon: Loader2, className: "animate-spin text-primary-text" },
  done: { Icon: CircleCheck, className: "text-success" },
  failed: { Icon: CircleAlert, className: "text-error" },
}

/**
 * What the app is waiting for, one line per process, each with its state.
 * The words stay the same; only the icon changes (pending, running, done,
 * failed), and the text stays near-black so the icon carries the colour.
 */
export function StatusList({ items, className }: StatusList.Props) {
  return (
    <ul className={cn("flex flex-col gap-3", className)}>
      {items.map((item) => {
        const { Icon, className: iconClass } = ICON[item.status]
        return (
          <li key={item.key} className="flex items-center gap-3 text-lg">
            <Icon
              aria-hidden="true"
              className={cn("size-6 shrink-0", iconClass)}
            />
            <span>{item.label}</span>
            <span className="sr-only">{item.status}</span>
          </li>
        )
      })}
    </ul>
  )
}

export declare namespace StatusList {
  type Item = { key: string; label: ReactNode; status: StatusListStatus }
  type Props = { items: Item[]; className?: string }
}
