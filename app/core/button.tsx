import type { ReactNode } from "react"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "~/utils/cn"

const BASE =
  "inline-flex shrink-0 items-center justify-center rounded-md text-center font-bold transition outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-muted disabled:text-disabled [&_svg]:shrink-0"

// What `unstyled` buttons build on; kept as-is so their `className` overrides keep their meaning.
const UNSTYLED_BASE =
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding text-xs font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-primary active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"

const buttonVariants = cva("", {
  variants: {
    variant: {
      primary: `${BASE} bg-primary text-on-primary active:bg-primary-pressed`,
      /** White with a light 2px outline (Ethan's popup buttons). */
      secondary: `${BASE} border-2 border-control bg-default text-primary active:bg-subtle disabled:border-transparent`,
      destructive: `${BASE} bg-error text-inverse active:bg-error-pressed`,
      /** Opt out and pass the whole look via `className`. */
      unstyled: UNSTYLED_BASE,
    },
    size: {
      sm: "min-h-10 gap-2 px-4 py-1.5 text-base/tight [&_svg]:size-4",
      md: "min-h-12 gap-2 px-5 py-2 text-lg/tight [&_svg]:size-5",
      /** The design system's one size (60px, Ethan 2026-10-21); sm and md remain for screens carried over from v1. */
      lg: "min-h-15 gap-3 px-6 py-2.5 text-lg/tight [&_svg]:size-6",
      unstyled: "",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
})

export function Button({
  busy = false,
  children,
  className,
  disabled,
  icon,
  size,
  variant,
  ...props
}: Button.Props) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || busy}
      {...props}
    >
      {busy ? <Loader2 className="animate-spin" /> : icon}
      {children}
    </ButtonPrimitive>
  )
}

export declare namespace Button {
  type Props = ButtonPrimitive.Props &
    VariantProps<typeof buttonVariants> & {
      /** Shown before the label; replaced by a spinner while `busy`. */
      icon?: ReactNode
      /** Disables the button and spins in place of `icon`. */
      busy?: boolean
    }
}
