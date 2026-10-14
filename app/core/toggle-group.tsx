import type { ReactNode } from "react"

import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group"

import { cn } from "~/utils/cn"

/** Single-select button group with arrow-key navigation. Not `Tabs`, since the panel it controls lives elsewhere in the tree. */
export function ToggleGroup({
  className,
  itemClassName,
  options,
  value,
  onValueChange,
}: ToggleGroup.Props) {
  return (
    <ToggleGroupPrimitive
      className={className}
      value={[value]}
      onValueChange={(next) => {
        // Empty means the active option was pressed again; keep it selected.
        if (next[0] !== undefined) {
          onValueChange(next[0])
        }
      }}
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <TogglePrimitive
            key={option.value}
            className={cn(
              "outline-none select-none focus-visible:ring-2 focus-visible:ring-primary",
              typeof itemClassName === "function"
                ? itemClassName(selected, option.value)
                : itemClassName
            )}
            value={option.value}
          >
            {option.label}
          </TogglePrimitive>
        )
      })}
    </ToggleGroupPrimitive>
  )
}

export declare namespace ToggleGroup {
  type Option = {
    label: ReactNode
    value: string
  }
  type Props = {
    className?: string
    /** Applied to every option. */
    itemClassName?: string | ((selected: boolean, value: string) => string)
    options: Option[]
    value: string
    onValueChange: (value: string) => void
  }
}
