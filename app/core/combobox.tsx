import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox"
import { Check, ChevronDown } from "lucide-react"

import { cn } from "~/utils/cn"

type Option = { detail?: string; label: string; value: string }

/** A single-value select the operator can type into to filter. Matches on `label` and `detail`; `className` styles the field box. */
export function Root({
  className,
  disabled,
  emptyText,
  options,
  placeholder,
  value,
  onValueChange,
  ...props
}: Root.Props) {
  const selected = options.find((option) => option.value === value) ?? null

  return (
    <ComboboxPrimitive.Root
      disabled={disabled}
      filter={matchesQuery}
      isItemEqualToValue={(item: Option, current: Option) =>
        item.value === current.value
      }
      itemToStringLabel={(option: Option) => option.label}
      items={options}
      value={selected}
      onValueChange={(next: Option | null) => {
        if (next) {
          onValueChange(next.value)
        }
      }}
    >
      <ComboboxPrimitive.InputGroup
        className={cn(
          "relative flex min-w-0 items-center has-disabled:opacity-50",
          className
        )}
      >
        <ComboboxPrimitive.Input
          className="size-full min-w-0 bg-transparent pr-10 outline-none"
          placeholder={placeholder}
          {...props}
        />
        <ComboboxPrimitive.Trigger className="absolute right-0 flex h-full w-12 items-center justify-center text-primary">
          <ChevronDown className="size-4" />
        </ComboboxPrimitive.Trigger>
      </ComboboxPrimitive.InputGroup>

      <ComboboxPrimitive.Portal>
        <ComboboxPrimitive.Positioner className="z-90" sideOffset={4}>
          <ComboboxPrimitive.Popup className="w-(--anchor-width) origin-(--transform-origin) rounded-lg border border-default bg-default bg-clip-padding shadow-dialog transition-[scale,opacity] duration-100 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0">
            <ComboboxPrimitive.Empty className="px-4 py-3 text-sm font-bold text-secondary empty:hidden">
              {emptyText}
            </ComboboxPrimitive.Empty>
            <ComboboxPrimitive.List className="max-h-[min(var(--available-height),24rem)] overflow-y-auto py-1 empty:hidden">
              {(option: Option) => (
                <ComboboxPrimitive.Item
                  key={option.value}
                  className="grid cursor-default grid-cols-[1rem_1fr] items-center gap-2 py-2 pr-4 pl-3 text-primary outline-none select-none data-highlighted:bg-muted"
                  value={option}
                >
                  <ComboboxPrimitive.ItemIndicator className="col-start-1 flex">
                    <Check className="size-4" />
                  </ComboboxPrimitive.ItemIndicator>
                  <div className="col-start-2 min-w-0">
                    <p className="truncate text-sm font-bold">{option.label}</p>
                    {option.detail && (
                      <p className="truncate text-xs text-secondary">
                        {option.detail}
                      </p>
                    )}
                  </div>
                </ComboboxPrimitive.Item>
              )}
            </ComboboxPrimitive.List>
          </ComboboxPrimitive.Popup>
        </ComboboxPrimitive.Positioner>
      </ComboboxPrimitive.Portal>
    </ComboboxPrimitive.Root>
  )
}

function matchesQuery(option: Option, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) {
    return true
  }
  return [option.label, option.detail].some((text) =>
    text?.toLowerCase().includes(needle)
  )
}

export declare namespace Root {
  type Props = {
    "aria-label"?: string
    className?: string
    disabled?: boolean
    emptyText: string
    options: Option[]
    placeholder?: string
    value: string
    onValueChange: (value: string) => void
  }
}
