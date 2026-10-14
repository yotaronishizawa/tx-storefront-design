import { NumberField as NumberFieldPrimitive } from "@base-ui/react/number-field"
import { Minus, Plus } from "lucide-react"

import { cn } from "~/utils/cn"

const STEP_BUTTON =
  "grid size-16 place-items-center rounded-full border border-strong bg-default text-primary transition active:bg-muted disabled:border-default disabled:bg-muted disabled:text-disabled"

/**
 * A number field clamped to `min`/`max`: `input` is an editable box, `stepper` a
 * large −/value/+ display. `allowOutOfRange` passes typed values on unclamped,
 * for a caller that warns about them; the buttons still clamp.
 */
export function Root({
  className,
  decrementLabel,
  incrementLabel,
  inputClassName,
  layout = "input",
  max,
  min,
  suffix,
  value,
  onValueChange,
  ...props
}: Root.Props) {
  const stepper = layout === "stepper"

  return (
    <NumberFieldPrimitive.Root
      className={cn("inline-flex", className)}
      max={max}
      min={min}
      value={value}
      onValueChange={(next) => {
        if (next !== null) {
          onValueChange(next)
        }
      }}
      {...props}
    >
      <NumberFieldPrimitive.Group
        className={cn("flex items-center", stepper ? "gap-4" : "w-full")}
      >
        {stepper && (
          <NumberFieldPrimitive.Decrement
            aria-label={decrementLabel}
            className={STEP_BUTTON}
          >
            <Minus className="size-7" />
          </NumberFieldPrimitive.Decrement>
        )}

        {stepper ? (
          <div className="min-w-32 text-center">
            {/* The stepper buttons read the value from this input, so it stays mounted. */}
            <NumberFieldPrimitive.Input className="sr-only" tabIndex={-1} />
            <span className="text-display-xl font-bold tracking-normal text-primary">
              {value}
            </span>
            {suffix && (
              <span className="ml-3 text-display font-bold text-secondary">
                {suffix}
              </span>
            )}
          </div>
        ) : (
          <NumberFieldPrimitive.Input
            className={cn("w-full", inputClassName)}
          />
        )}

        {stepper && (
          <NumberFieldPrimitive.Increment
            aria-label={incrementLabel}
            className={STEP_BUTTON}
          >
            <Plus className="size-7" />
          </NumberFieldPrimitive.Increment>
        )}
      </NumberFieldPrimitive.Group>
    </NumberFieldPrimitive.Root>
  )
}

export declare namespace Root {
  type Props = {
    allowOutOfRange?: boolean
    "aria-label"?: string
    className?: string
    decrementLabel?: string
    disabled?: boolean
    id?: string
    incrementLabel?: string
    inputClassName?: string
    layout?: "input" | "stepper"
    max?: number
    min?: number
    suffix?: string
    value: number
    onValueChange: (value: number) => void
  }
}
