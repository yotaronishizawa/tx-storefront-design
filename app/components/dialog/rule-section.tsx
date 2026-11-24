import type { ReactNode } from "react"

/** One titled rule card in a session's start dialog; `children` hold its illustrations. */
export function RuleSection({
  children,
  subtitle,
  title,
}: {
  children: ReactNode
  subtitle?: string
  title: string
}) {
  return (
    <section className="flex shrink-0 flex-col rounded-lg border bg-default p-3">
      <h3 className="mb-2 shrink-0 text-lg/tight font-bold tracking-normal text-primary">
        {title}
        {subtitle && (
          <span className="ml-2 text-base font-normal text-secondary">
            {subtitle}
          </span>
        )}
      </h3>
      {children}
    </section>
  )
}
