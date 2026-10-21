import type { ComponentProps, ReactNode, RefObject } from "react"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { CircleAlert, Info, TriangleAlert } from "lucide-react"

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

const POPUP_ICON = {
  error: { Icon: CircleAlert, className: "text-error" },
  info: { Icon: Info, className: "text-info" },
  warning: { Icon: TriangleAlert, className: "text-warning" },
} as const

const POPUP_SIZE = {
  /** 680: messages and decisions. */
  default: "w-170",
  /** 1040: a grid, a list with pictures, or more than 3 items in a row. */
  wide: "w-260",
  /** Long content (manuals, videos): the screen less 40 on every side. */
  panel: "h-[calc(100dvh-5rem)] w-[calc(100vw-5rem)]",
}

/**
 * The popup of the design system (Ethan's Dialog & Panel spec): one shape,
 * every value fixed. Title (with an icon only for error, info or warning),
 * the content, then the actions; a close icon at the top right unless the
 * popup is blocking (no `onClose`: it closes by itself when the task ends).
 */
export function Popup({
  open,
  onClose,
  title,
  icon,
  size = "default",
  actions,
  children,
  initialFocus,
  layer,
  role = "dialog",
  closeLabel,
}: Popup.Props) {
  const iconSpec = icon ? POPUP_ICON[icon] : null
  return (
    <Root
      className={cn(
        "relative flex max-h-[calc(100dvh-5rem)] max-w-[calc(100vw-5rem)] flex-col gap-8 p-8",
        POPUP_SIZE[size]
      )}
      // A stray tap beside an alert (an error, a confirmation) must not answer it.
      dismissOnScrimClick={Boolean(onClose) && role !== "alertdialog"}
      initialFocus={initialFocus}
      label={title ? undefined : closeLabel}
      layer={layer}
      open={open}
      role={role}
      onDismiss={onClose}
    >
      {title && (
        <div className="flex shrink-0 items-start gap-3 pe-12">
          {iconSpec && (
            <iconSpec.Icon
              aria-hidden="true"
              className={cn("size-8 shrink-0", iconSpec.className)}
            />
          )}
          <Title className="min-w-0 flex-1 pt-0.5 text-left text-xl/tight">
            {title}
          </Title>
        </div>
      )}
      {onClose && (
        <Close aria-label={closeLabel} className="absolute inset-e-4 top-4" />
      )}
      {/* No content (a question in the title alone): no empty block either. */}
      {children != null && children !== false && (
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto text-lg text-primary",
            !title && onClose && "pe-12"
          )}
        >
          {children}
        </div>
      )}
      {actions}
    </Root>
  )
}

export declare namespace Popup {
  type Props = {
    open: boolean
    /** Close icon and Escape (and a scrim tap, unless it is an alertdialog); leave out for a blocking popup. */
    onClose?: () => void
    title?: ReactNode
    /** Only for error, info or warning. */
    icon?: keyof typeof POPUP_ICON
    size?: keyof typeof POPUP_SIZE
    /** A `Dialog.Actions` row. */
    actions?: ReactNode
    /** The content: blocks stack 16 apart. */
    children?: ReactNode
    initialFocus?: RefObject<HTMLElement | null>
    layer?: Root.Props["layer"]
    role?: "alertdialog" | "dialog"
    /** Accessible name of the close icon (and of a popup without a title). */
    closeLabel?: string
  }
}

/**
 * The popup's buttons: full width, split evenly, 16 apart, never stacked.
 * The main action goes first (on the left), as staff know it. Use
 * `Button size="lg"` in it.
 */
export function Actions({ className, ...props }: Actions.Props) {
  return (
    <div
      className={cn(
        "grid shrink-0 auto-cols-fr grid-flow-col gap-4 *:w-full *:px-4",
        className
      )}
      {...props}
    />
  )
}

export declare namespace Actions {
  type Props = ComponentProps<"div">
}
