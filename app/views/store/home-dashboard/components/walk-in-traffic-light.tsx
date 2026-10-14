import { cn } from "~/utils/cn"

const WALK_IN_LIGHT = {
  allowed: {
    panel: "border-success bg-success-subtle",
    red: "bg-error/20",
    green: "bg-success",
    title: "text-success",
  },
  forbidden: {
    panel: "border-error bg-error-subtle",
    red: "bg-error",
    green: "bg-success/20",
    title: "text-error",
  },
}

export function WalkInTrafficLight({
  accessible,
  label,
  title,
}: {
  accessible: boolean
  label: string
  title: string
}) {
  const light = WALK_IN_LIGHT[accessible ? "allowed" : "forbidden"]

  return (
    <div
      className={cn(
        "flex h-16 min-w-0 flex-1 items-center gap-3 rounded-lg border-2 px-3 lg:max-w-80",
        light.panel
      )}
    >
      <div
        aria-hidden
        className="flex shrink-0 flex-col gap-1 rounded-full bg-inverse p-1"
      >
        <span className={cn("size-5 rounded-full transition", light.red)} />
        <span className={cn("size-5 rounded-full transition", light.green)} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs/tight font-medium text-secondary">
          {label}
        </p>
        <p
          className={cn(
            "truncate text-lg/tight font-bold tracking-normal",
            light.title
          )}
        >
          {title}
        </p>
      </div>
    </div>
  )
}
