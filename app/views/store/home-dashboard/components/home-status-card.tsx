import { cn } from "~/utils/cn"

export function HomeStatusCard({
  barClassName,
  label,
  title,
}: {
  barClassName: string
  label: string
  title: string
}) {
  return (
    <div className="flex h-16 min-w-0 flex-1 items-center gap-3 rounded-lg border bg-default px-3 lg:max-w-80">
      <span className={cn("h-10 w-2 shrink-0 rounded-full", barClassName)} />
      <div className="min-w-0">
        <p className="truncate text-xs/tight font-medium text-secondary">
          {label}
        </p>
        <p className="truncate text-lg/tight font-bold tracking-normal">
          {title}
        </p>
      </div>
    </div>
  )
}
