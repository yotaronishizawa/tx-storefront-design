import type { ComponentProps, ReactNode, RefObject } from "react"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "~/utils/cn"

import { CloseButton } from "./close-button"

// `layer` is load-bearing: manual start < video tutorial < confirm/message, since a confirm can open over either.
const LAYER = { base: "z-70", raised: "z-75", top: "z-80" }

const backdropVariants = cva("fixed inset-0 bg-overlay", {
  variants: { layer: LAYER },
  defaultVariants: { layer: "top" },
})

const viewportVariants = cva("fixed inset-0 grid place-items-center p-4", {
  variants: {
    layer: LAYER,
    inset: { default: "", wide: "sm:p-10" },
  },
  defaultVariants: { inset: "default", layer: "top" },
})

/** Modal shell. Omit `onDismiss` to make it non-dismissable; a scrim tap dismisses only with `dismissOnScrimClick`. */
export function Root({
  children,
  className,
  dismissOnScrimClick = false,
  initialFocus,
  inset,
  label,
  labelledById,
  layer,
  open,
  role = "dialog",
  onDismiss,
}: Root.Props) {
  return (
    <DialogPrimitive.Root
      disablePointerDismissal={!dismissOnScrimClick}
      modal
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onDismiss?.()
        }
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className={backdropVariants({ layer })} />
        <DialogPrimitive.Viewport
          className={viewportVariants({ inset, layer })}
        >
          <DialogPrimitive.Popup
            aria-label={label}
            // Passed only when set, so it does not clobber the id `Title` registers.
            {...(labelledById && { "aria-labelledby": labelledById })}
            className={cn(
              "w-full rounded-xl bg-default shadow-dialog",
              className
            )}
            // Base UI focuses the first control when no ref is given.
            initialFocus={initialFocus ?? true}
            role={role}
          >
            {children}
          </DialogPrimitive.Popup>
        </DialogPrimitive.Viewport>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export declare namespace Root {
  type Props = VariantProps<typeof backdropVariants> &
    VariantProps<typeof viewportVariants> & {
      children: ReactNode
      /** Layout for this dialog's panel — size, padding, grid. */
      className: string
      dismissOnScrimClick?: boolean
      /**
       * Focused on open. Point it at the least destructive control, so a
       * scanner's trailing Enter cannot confirm anything; a dialog whose first
       * control is already the safe one can leave it out.
       */
      initialFocus?: RefObject<HTMLElement | null>
      /** Accessible name, for a dialog with no `Title`. */
      label?: string
      /** For a heading that cannot be a `Title`. */
      labelledById?: string
      open: boolean
      role?: "alertdialog" | "dialog"
      onDismiss?: () => void
    }
}

export function Title({ className, ...props }: Title.Props) {
  return (
    <DialogPrimitive.Title
      className={cn(
        "text-xl font-bold tracking-normal text-primary",
        className
      )}
      {...props}
    />
  )
}

export declare namespace Title {
  type Props = DialogPrimitive.Title.Props
}

export function Message({ className, ...props }: Message.Props) {
  return (
    <DialogPrimitive.Description
      className={cn(
        "text-center text-lg/relaxed font-bold whitespace-pre-line text-primary",
        className
      )}
      {...props}
    />
  )
}

export declare namespace Message {
  type Props = DialogPrimitive.Description.Props
}

/** Closes through `Root`'s `onDismiss`. */
export function Close(props: Close.Props) {
  return <DialogPrimitive.Close render={<CloseButton />} {...props} />
}

export declare namespace Close {
  type Props = Omit<DialogPrimitive.Close.Props, "children">
}

/** The scrollable body between a dialog's title and its footer. */
export function Content({ className, ...props }: Content.Props) {
  return (
    <div
      className={cn(
        "mt-4 min-h-0 overflow-auto rounded-lg bg-subtle p-3",
        className
      )}
      {...props}
    />
  )
}

export declare namespace Content {
  type Props = ComponentProps<"div">
}

/** An equal-width row of `Button`s. */
export function Footer({ className, ...props }: Footer.Props) {
  return (
    <div
      className={cn(
        "mx-auto grid w-full shrink-0 grid-cols-2 gap-4",
        className
      )}
      {...props}
    />
  )
}

export declare namespace Footer {
  type Props = ComponentProps<"div">
}
