import { Phone } from "lucide-react"

import { OPERATIONS_CENTER_PHONE } from "~/config/app"
import { cn } from "~/utils/cn"

/**
 * The way out when the screen cannot help: the operations centre's number,
 * tappable. One look wherever it appears, so staff learn to find it.
 * - `card`: under a problem, after a "when this does not help" heading.
 * - `strip`: one line at the foot of a page of help.
 */
export function SupportContact({
  variant = "card",
  heading,
  message,
  className,
}: SupportContact.Props) {
  const link = (
    <a
      href={`tel:${OPERATIONS_CENTER_PHONE}`}
      className={cn(
        "flex rounded-lg border border-info/20 bg-info-subtle px-4 py-3",
        variant === "card" ? "flex-col gap-1" : "items-center gap-3",
        !heading && className
      )}
    >
      {variant === "strip" && (
        <Phone aria-hidden="true" className="size-5 shrink-0 text-info" />
      )}
      <span className={cn("text-base", variant === "strip" && "flex-1")}>
        {message}
      </span>
      <span className="text-xl font-bold text-info">
        {OPERATIONS_CENTER_PHONE}
      </span>
    </a>
  )
  if (!heading) return link
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <p className="flex items-center gap-2 text-base font-bold">
        <Phone aria-hidden="true" className="size-5 shrink-0" />
        {heading}
      </p>
      {link}
    </div>
  )
}

export declare namespace SupportContact {
  type Props = {
    variant?: "card" | "strip"
    /** When to call, e.g. "If you cannot find the obstacle". */
    heading?: string
    /** What to say or why to call, e.g. "Please contact support." */
    message: string
    className?: string
  }
}
