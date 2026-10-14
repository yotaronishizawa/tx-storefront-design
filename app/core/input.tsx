import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "~/utils/cn"

export function Input({ className, ...props }: Input.Props) {
  return (
    <InputPrimitive
      className={cn(
        "min-w-0 bg-transparent outline-none placeholder:text-disabled disabled:text-disabled",
        className
      )}
      {...props}
    />
  )
}

export declare namespace Input {
  type Props = InputPrimitive.Props
}
