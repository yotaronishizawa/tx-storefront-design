import type { ReactNode } from "react"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { ChevronRight } from "lucide-react"

import { cn } from "~/utils/cn"

/**
 * A large tappable card for choosing what to do next: Home's entries, the
 * choices behind "More", a document in a list. Not for a form's submit or a
 * dialog's answer: those are a Button.
 */
const cardVariants = cva(
  "flex w-full min-w-0 rounded-lg border-2 border-control bg-default text-left whitespace-normal text-primary transition outline-none focus-visible:ring-2 focus-visible:ring-primary active:bg-subtle disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      layout: {
        /** Icon, text, then an optional chevron, in one line. */
        row: "items-center gap-3 px-4 py-3",
        /** Icon on top, title at the bottom: a grid of a few equal choices. */
        tile: "min-h-40 flex-col items-start justify-between gap-4 p-5",
        /** A picture on top (a video still), the text under it. */
        media: "flex-col items-stretch overflow-hidden",
      },
      size: {
        md: "",
        /** Denser rows for longer lists. */
        sm: "",
      },
      selected: {
        true: "border-primary bg-primary-subtle active:bg-primary-subtle",
        false: "",
      },
    },
    compoundVariants: [
      { layout: "row", size: "md", className: "min-h-24" },
      { layout: "row", size: "sm", className: "min-h-16" },
    ],
    defaultVariants: { layout: "row", size: "md", selected: false },
  }
)

export function ChoiceCard({
  icon,
  title,
  description,
  media,
  chevron = false,
  layout = "row",
  size = "md",
  selected,
  className,
  ...props
}: ChoiceCard.Props) {
  const small = size === "sm"
  const text = (
    <span
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-1",
        layout === "media" && "p-3"
      )}
    >
      <span
        className={cn(
          "font-bold",
          small || layout === "media" ? "text-lg/tight" : "text-xl/tight"
        )}
      >
        {title}
      </span>
      {description && (
        <span
          className={cn(
            "text-secondary",
            small ? "text-sm" : "text-base/tight"
          )}
        >
          {description}
        </span>
      )}
    </span>
  )

  return (
    <ButtonPrimitive
      data-slot="choice-card"
      aria-pressed={selected ?? undefined}
      className={cn(cardVariants({ layout, size, selected }), className)}
      {...props}
    >
      {layout === "media" && media}
      {icon && layout !== "media" && (
        <span
          aria-hidden="true"
          className={cn(
            "grid shrink-0 place-items-center bg-subtle text-secondary",
            layout === "tile"
              ? "size-16 rounded-lg [&_svg]:size-8"
              : small
                ? "size-8 rounded-md [&_svg]:size-5"
                : "size-10 rounded-md [&_svg]:size-6"
          )}
        >
          {icon}
        </span>
      )}
      {text}
      {chevron && layout === "row" && (
        <ChevronRight
          aria-hidden="true"
          className="size-6 shrink-0 text-secondary"
        />
      )}
    </ButtonPrimitive>
  )
}

export declare namespace ChoiceCard {
  type Props = Omit<ButtonPrimitive.Props, "title"> &
    VariantProps<typeof cardVariants> & {
      /** An icon or a small picture; sits in a grey square. */
      icon?: ReactNode
      title: ReactNode
      /** One line under the title: what is inside, or a detail. */
      description?: ReactNode
      /** For `layout="media"`: the picture shown above the text. */
      media?: ReactNode
      /** For `layout="row"`: the card opens more choices or another screen. */
      chevron?: boolean
    }
}
