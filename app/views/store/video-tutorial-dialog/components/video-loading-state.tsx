import { Loader2 } from "lucide-react"

export function VideoLoadingState({ title }: { title: string }) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-muted">
      <div className="flex flex-col items-center gap-6 px-6 text-center text-secondary">
        <Loader2 className="size-10 animate-spin" />
        <p className="text-xl font-bold">{title}</p>
      </div>
    </div>
  )
}
