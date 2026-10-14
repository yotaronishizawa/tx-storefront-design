import { Select as SelectPrimitive } from "@base-ui/react/select"
import { Check, ChevronDown } from "lucide-react"

import { cn } from "~/utils/cn"

type Option = { label: string; value: string }

/** A single-value select. Options are data, so every call site gets the same popup; `className` styles the trigger. */
export function Root({
  className,
  disabled,
  options,
  placeholder = "--",
  value,
  onValueChange,
  ...props
}: Root.Props) {
  return (
    <SelectPrimitive.Root
      disabled={disabled}
      // Lets the trigger show a label for a value set from outside, before the popup has ever opened.
      items={options}
      value={value}
      onValueChange={(next) => onValueChange(next ?? "")}
    >
      <SelectPrimitive.Trigger
        className={cn(
          "inline-flex items-center justify-between gap-2 outline-none select-none disabled:opacity-50",
          className
        )}
        {...props}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon className="shrink-0">
          <ChevronDown className="size-4" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner className="z-90" sideOffset={4}>
          <SelectPrimitive.Popup className="min-w-(--anchor-width) origin-(--transform-origin) rounded-lg border border-default bg-default bg-clip-padding shadow-dialog transition-[scale,opacity] duration-100 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0">
            <SelectPrimitive.List className="max-h-(--available-height) overflow-y-auto py-1">
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  className="grid cursor-default grid-cols-[1rem_1fr] items-center gap-2 py-2 pr-4 pl-3 text-sm font-bold text-primary outline-none select-none data-highlighted:bg-muted"
                  value={option.value}
                >
                  <SelectPrimitive.ItemIndicator className="col-start-1 flex">
                    <Check className="size-4" />
                  </SelectPrimitive.ItemIndicator>
                  <SelectPrimitive.ItemText className="col-start-2">
                    {option.label}
                  </SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.List>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

export declare namespace Root {
  type Props = {
    "aria-label"?: string
    className?: string
    disabled?: boolean
    options: Option[]
    placeholder?: string
    value: string
    onValueChange: (value: string) => void
  }
}
