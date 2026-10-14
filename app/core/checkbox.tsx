import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { Check } from "lucide-react"

import { cn } from "~/utils/cn"

export function Root({ className, ...props }: Root.Props) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "grid size-4 shrink-0 place-items-center rounded-sm border border-strong bg-default outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:border-default disabled:bg-muted data-checked:border-primary data-checked:bg-primary",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex text-on-primary data-unchecked:hidden">
        <Check className="size-3" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export declare namespace Root {
  type Props = CheckboxPrimitive.Root.Props
}
