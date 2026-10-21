import type { ReactNode } from "react"

import { cva, type VariantProps } from "class-variance-authority"
import {
  CircleAlert,
  CircleCheck,
  Info,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react"

import { cn } from "~/utils/cn"

const TONE_ICON: Record<NonNullable<Notice.Tone>, LucideIcon | null> = {
  neutral: null,
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  error: CircleAlert,
}

/**
 * One line (or a short block) telling staff the state of things where they
 * are looking: "stopping the robot", "still detected", "changes not sent".
 * Text stays near-black on a tinted background; the icon carries the tone.
 * Not for a decision (a Dialog) or a passing confirmation (a Toast).
 */
const noticeVariants = cva(
  "flex w-full items-start gap-3 rounded-md px-4 py-3 text-base text-primary",
  {
    variants: {
      tone: {
        neutral: "bg-subtle",
        info: "bg-info-subtle",
        success: "bg-success-subtle",
        warning: "bg-warning-subtle",
        error: "bg-error-subtle",
      },
      /** `outline` adds the tone's border, for what must not be missed. */
      emphasis: {
        subtle: "",
        outline: "border-2",
      },
    },
    compoundVariants: [
      { emphasis: "outline", tone: "neutral", className: "border-strong" },
      { emphasis: "outline", tone: "info", className: "border-info" },
      { emphasis: "outline", tone: "success", className: "border-success" },
      { emphasis: "outline", tone: "warning", className: "border-warning" },
      { emphasis: "outline", tone: "error", className: "border-error" },
    ],
    defaultVariants: { tone: "neutral", emphasis: "subtle" },
  }
)

const ICON_COLOUR: Record<NonNullable<Notice.Tone>, string> = {
  neutral: "text-secondary",
  info: "text-info",
  success: "text-success",
  warning: "text-warning",
  error: "text-error",
}

export function Notice({
  tone,
  emphasis,
  icon,
  title,
  action,
  children,
  className,
  role = "status",
}: Notice.Props) {
  const toneKey = tone ?? "neutral"
  const Icon = icon === false ? null : (icon ?? TONE_ICON[toneKey])
  return (
    <div
      role={role}
      className={cn(noticeVariants({ tone, emphasis }), className)}
    >
      {Icon && (
        <Icon
          aria-hidden="true"
          className={cn("mt-0.5 size-6 shrink-0", ICON_COLOUR[toneKey])}
        />
      )}
      <div className="min-w-0 flex-1">
        {title && <p className="font-bold">{title}</p>}
        <div className={title ? undefined : "font-bold"}>{children}</div>
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  )
}

export declare namespace Notice {
  type Tone = VariantProps<typeof noticeVariants>["tone"]
  type Props = VariantProps<typeof noticeVariants> & {
    /** Replaces the tone's icon; `false` shows none. */
    icon?: LucideIcon | false
    /** A bold first line; the children then read as its detail. */
    title?: ReactNode
    /** One small action at the end, e.g. "Show how". */
    action?: ReactNode
    children: ReactNode
    className?: string
    /** `alert` only when it appears because something went wrong just now. */
    role?: "status" | "alert"
  }
}
