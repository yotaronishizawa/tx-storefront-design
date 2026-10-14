import { Field as FieldPrimitive } from "@base-ui/react/field"

import { cn } from "~/utils/cn"

export function Root({ className, ...props }: Root.Props) {
  return <FieldPrimitive.Root className={cn("min-w-0", className)} {...props} />
}

export declare namespace Root {
  type Props = FieldPrimitive.Root.Props
}

export function Label({ className, ...props }: Label.Props) {
  return (
    <FieldPrimitive.Label
      className={cn("block text-xs font-bold", className)}
      {...props}
    />
  )
}

export declare namespace Label {
  type Props = FieldPrimitive.Label.Props
}

export function Control({ className, ...props }: Control.Props) {
  return (
    <FieldPrimitive.Control
      className={cn(
        "min-w-0 bg-transparent outline-none placeholder:text-disabled",
        className
      )}
      {...props}
    />
  )
}

export declare namespace Control {
  type Props = FieldPrimitive.Control.Props
}
