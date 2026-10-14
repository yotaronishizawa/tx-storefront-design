import { cn } from "~/utils/cn"

export function PanelTitle({
  id,
  size = "md",
  title,
}: {
  id?: string
  size?: "md" | "sm"
  title: string
}) {
  return (
    <h2
      id={id}
      className={cn(
        "mt-4 border-l-4 border-primary pl-2 font-bold tracking-normal first:mt-0",
        size === "sm" ? "text-base" : "text-lg"
      )}
    >
      {title}
    </h2>
  )
}
