import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/*
 * Theme names outside Tailwind's t-shirt pattern read as colours to
 * tailwind-merge, so it would drop `shadow-dialog` next to a shadow colour.
 * Register every such name from app/app.css here.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      shadow: ["dialog"],
      text: ["display", "display-lg", "display-xl"],
    },
  },
})

/**
 * Joins class names, letting later Tailwind classes win over earlier ones.
 *
 * @example
 * cn("px-2 text-xs", false, "px-4") // "text-xs px-4"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
