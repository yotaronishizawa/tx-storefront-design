import { X } from "lucide-react"

import { cn } from "~/utils/cn"

import { Button } from "./button"

/** The one close (X) look, shared by `Dialog.Close` and `Drawer.Close`; not exported from the kit. */
export function CloseButton({
  className,
  ...props
}: Omit<Button.Props, "children" | "size" | "variant">) {
  return (
    <Button
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-full border border-strong text-secondary transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:bg-muted [&_svg]:size-5",
        className
      )}
      size="unstyled"
      variant="unstyled"
      {...props}
    >
      <X />
    </Button>
  )
}
