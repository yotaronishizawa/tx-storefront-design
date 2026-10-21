import { X } from "lucide-react"

import { cn } from "~/utils/cn"

import { Button } from "./button"

/** The one close (X) look, shared by `Dialog.Close` and `Drawer.Close`: a 24 icon in a 56 tap area, no frame (Ethan's popup spec); not exported from the kit. */
export function CloseButton({
  className,
  ...props
}: Omit<Button.Props, "children" | "size" | "variant">) {
  return (
    <Button
      className={cn(
        "grid size-14 shrink-0 place-items-center rounded-full text-secondary transition focus-visible:ring-2 focus-visible:ring-primary active:bg-subtle [&_svg]:size-6",
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
