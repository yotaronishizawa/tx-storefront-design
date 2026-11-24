import { Button } from "~/core"

/**
 * Study (`?homeLayout=b`): layout change as a third large card beside restock
 * and take-out. Same frame and title as those two; no drawing of its own yet,
 * so the grid icon stands in, large, where their drawings sit.
 */
export function HomeLayoutAction({
  label,
  disabled,
  onClick,
}: {
  label: string
  disabled: boolean
  onClick: () => void
}) {
  return (
    <Button
      variant="unstyled"
      size="unstyled"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="relative size-full min-h-64 min-w-0 flex-col items-start justify-start overflow-hidden rounded-lg border-2 border-control bg-default text-left whitespace-normal text-primary lg:min-h-56"
    >
      <span className="flex w-full min-w-0 shrink-0 px-4 pt-4 text-[2rem]/tight font-bold lg:px-5 lg:pt-5">
        {label}
      </span>
      <span
        aria-hidden="true"
        className="grid min-h-0 w-full flex-1 place-items-center p-6"
      >
        <img
          src="/assets/home-study-2026-10-06/layout.svg"
          alt=""
          draggable={false}
          className="size-32 opacity-70"
        />
      </span>
    </Button>
  )
}
