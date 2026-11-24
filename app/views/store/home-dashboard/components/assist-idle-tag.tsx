import { TriangleAlert } from "lucide-react"

/**
 * The idle screen's 対応可能: an operator request staff could fix by hand
 * sooner. A yellow tag under the checks says what happened and that fixing it
 * in store gets the robot going sooner; the status headline stays the robot's
 * own, and red stays for what only staff can clear (Yotaro 2026-11-17).
 */
export function AssistIdleTag({
  title,
  note,
}: {
  title: string
  note: string
}) {
  return (
    <p className="mt-6 flex items-start gap-3 self-start rounded-xl bg-primary px-5 py-4 text-primary">
      <TriangleAlert aria-hidden="true" className="mt-0.5 size-7 shrink-0" />
      <span className="grid gap-1.5">
        <span className="text-xl/tight font-bold">{title}</span>
        <span className="text-lg/tight font-medium">{note}</span>
      </span>
    </p>
  )
}
