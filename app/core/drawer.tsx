import type { ReactNode } from "react"

import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer"

import { cn } from "~/utils/cn"

import { CloseButton } from "./close-button"

/** Right-side panel. Tapping outside closes it, so it must not hold a confirmation. */
export function Root({ children, className, open, onDismiss }: Root.Props) {
  return (
    <DrawerPrimitive.Root
      modal
      open={open}
      swipeDirection="right"
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onDismiss()
        }
      }}
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Backdrop className="fixed inset-0 z-60 bg-overlay transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <DrawerPrimitive.Viewport className="fixed inset-0 z-60 flex justify-end">
          <DrawerPrimitive.Popup
            className={cn(
              "h-full w-[min(560px,92vw)] translate-x-(--drawer-swipe-movement-x) rounded-l-xl bg-default shadow-dialog transition-transform duration-200 outline-none data-ending-style:translate-x-full data-starting-style:translate-x-full",
              className
            )}
          >
            {children}
          </DrawerPrimitive.Popup>
        </DrawerPrimitive.Viewport>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  )
}

export declare namespace Root {
  type Props = {
    children: ReactNode
    className?: string
    open: boolean
    onDismiss: () => void
  }
}

export function Title({ className, ...props }: Title.Props) {
  return (
    <DrawerPrimitive.Title
      className={cn(
        "border-l-4 border-primary pl-3 text-lg font-bold tracking-normal text-primary",
        className
      )}
      {...props}
    />
  )
}

export declare namespace Title {
  type Props = DrawerPrimitive.Title.Props
}

/** Closes through `Root`'s `onDismiss`. */
export function Close(props: Close.Props) {
  return <DrawerPrimitive.Close render={<CloseButton />} {...props} />
}

export declare namespace Close {
  type Props = Omit<DrawerPrimitive.Close.Props, "children">
}
