import { cn } from "~/utils/cn"

/** Before → after sketch: lanes per row for the faces question, row heights for the height one. */
export function ShelfQuestionIllustration({
  variant,
}: {
  variant: "faces" | "height"
}) {
  const isFaces = variant === "faces"

  return (
    <div className="grid min-h-52 place-items-center rounded-md bg-subtle p-4">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-5">
        <ShelfSketch rows={[5, 5]} />
        <span className="text-display-lg font-bold">→</span>
        <ShelfSketch rows={isFaces ? [6, 4] : [4, 6]} shifted={!isFaces} />
      </div>
    </div>
  )
}

function ShelfSketch({
  rows,
  shifted = false,
}: {
  rows: number[]
  shifted?: boolean
}) {
  return (
    <div className="grid gap-2 rounded-md border-4 border-strong bg-default p-3">
      {rows.map((count, rowIndex) => (
        <div
          key={`${count}-${rowIndex}`}
          className={cn("grid gap-1", shifted && rowIndex === 0 && "mt-3")}
          style={{ gridTemplateColumns: `repeat(${count}, 10px)` }}
        >
          {Array.from({ length: count }, (_, index) => (
            <span
              key={index}
              className="h-8 rounded-t-full border-2 border-strong bg-default"
            />
          ))}
        </div>
      ))}
    </div>
  )
}
