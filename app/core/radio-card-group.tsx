import type { ReactNode } from "react"

import { Radio } from "@base-ui/react/radio"
import { RadioGroup } from "@base-ui/react/radio-group"

import { cn } from "~/utils/cn"

/**
 * Pick one of a few options, each a card with a title and a line under it
 * (Ethan's "Rich Radio Group"). The chosen card turns orange, so the choice
 * reads at a glance. Choosing does nothing yet; a Button confirms it.
 */
export function RadioCardGroup({
  options,
  value,
  onValueChange,
  label,
  className,
}: RadioCardGroup.Props) {
  return (
    <RadioGroup
      aria-label={label}
      value={value}
      onValueChange={(next) => onValueChange(String(next))}
      className={cn("grid grid-cols-2 gap-4", className)}
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <Radio.Root
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className={cn(
              "flex min-h-17 items-center gap-4 rounded-lg border-2 px-4 py-3 text-left outline-none disabled:cursor-not-allowed disabled:opacity-50",
              selected
                ? "border-warning bg-warning-subtle"
                : "border-control bg-default active:bg-subtle"
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full border-2 bg-default",
                selected ? "border-warning" : "border-default"
              )}
            >
              <Radio.Indicator className="size-3 rounded-full bg-warning" />
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-lg/tight">{option.label}</span>
              {option.description && (
                <span className="text-sm text-secondary">
                  {option.description}
                </span>
              )}
            </span>
          </Radio.Root>
        )
      })}
    </RadioGroup>
  )
}

export declare namespace RadioCardGroup {
  type Option = {
    value: string
    label: ReactNode
    /** One line under the label. */
    description?: ReactNode
    disabled?: boolean
  }
  type Props = {
    options: Option[]
    value: string
    onValueChange: (value: string) => void
    /** What is being chosen, for screen readers. */
    label: string
    className?: string
  }
}
