import type { ReactElement, ReactNode } from "react"

import { Popover as PopoverPrimitive } from "@base-ui/react/popover"

import { cn } from "~/utils/cn"

/** A card anchored to its trigger; tapping outside closes it unless `onOpenChange` refuses. */
export function Root({ children, open, onOpenChange }: Root.Props) {
  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => onOpenChange(nextOpen)}
    >
      {children}
    </PopoverPrimitive.Root>
  )
}

export declare namespace Root {
  type Props = {
    children: ReactNode
    open: boolean
    onOpenChange: (open: boolean) => void
  }
}

/** Renders `render` (usually a `Button`) as the trigger. */
export function Trigger({ render }: Trigger.Props) {
  return <PopoverPrimitive.Trigger render={render} />
}

export declare namespace Trigger {
  type Props = { render: ReactElement }
}

/** Below the dialogs' layers, so a confirm opened from it covers it. */
export function Popup({ children, className, label }: Popup.Props) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        align="start"
        className="z-60"
        side="bottom"
        sideOffset={8}
      >
        <PopoverPrimitive.Popup
          aria-label={label}
          className={cn(
            "rounded-xl bg-default shadow-dialog outline-none",
            className
          )}
        >
          {children}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

export declare namespace Popup {
  type Props = { children: ReactNode; className?: string; label: string }
}
