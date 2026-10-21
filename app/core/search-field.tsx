import { Search, X } from "lucide-react"

import { cn } from "~/utils/cn"

import { Input } from "./input"

/**
 * The one search box (Ethan's "Input search"): a search icon, the text, and
 * a clear button once something is typed. Searches as staff type; there is
 * no submit button.
 */
export function SearchField({
  value,
  onValueChange,
  placeholder,
  clearLabel,
  className,
}: SearchField.Props) {
  return (
    <label
      className={cn(
        "flex min-h-12 min-w-0 items-center gap-3 rounded-md border border-control bg-default px-4 focus-within:border-strong",
        className
      )}
    >
      <Search aria-hidden="true" className="size-5 shrink-0 text-primary" />
      <Input
        value={value}
        onValueChange={onValueChange}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-full flex-1 text-lg"
      />
      {value && (
        <button
          type="button"
          aria-label={clearLabel}
          onClick={() => onValueChange("")}
          className="grid size-9 shrink-0 place-items-center rounded-full text-secondary outline-none active:bg-subtle"
        >
          <X aria-hidden="true" className="size-5" />
        </button>
      )}
    </label>
  )
}

export declare namespace SearchField {
  type Props = {
    value: string
    onValueChange: (value: string) => void
    /** Says what can be searched, with an example. */
    placeholder: string
    /** Accessible name of the clear button. */
    clearLabel: string
    className?: string
  }
}
