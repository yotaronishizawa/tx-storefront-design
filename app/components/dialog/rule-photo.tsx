import { Check, X } from "lucide-react"

import { cn } from "~/utils/cn"

const TONES = {
  bad: { badge: "bg-error", frame: "border-error", icon: X },
  good: {
    badge: "bg-success",
    frame: "border-success",
    icon: Check,
  },
}

export function RulePhoto({
  caption,
  src,
  tone,
}: {
  caption: string
  src: string
  tone: keyof typeof TONES
}) {
  const { badge, frame, icon: Icon } = TONES[tone]

  return (
    <figure className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div
        className={cn(
          "relative aspect-120/73 min-h-0 flex-1 overflow-hidden rounded-md border-5",
          frame
        )}
      >
        <img
          alt={caption}
          className="size-full object-cover"
          draggable={false}
          src={src}
        />
        <span
          className={cn(
            "absolute top-2 left-2 grid size-8 place-items-center rounded-sm text-inverse",
            badge
          )}
        >
          <Icon className="size-5 stroke-4" />
        </span>
      </div>
      <figcaption className="mt-1 shrink-0 text-center text-xs/tight font-bold text-primary">
        {caption}
      </figcaption>
    </figure>
  )
}
