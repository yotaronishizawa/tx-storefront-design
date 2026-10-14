import type { ReactNode } from "react"

import { cn } from "~/utils/cn"

export function SettingsSection({
  children,
  description,
  icon,
  title,
  truncateDescription = false,
}: {
  children: ReactNode
  description?: ReactNode
  icon: ReactNode
  title: string
  truncateDescription?: boolean
}) {
  return (
    <section className="rounded-lg border bg-subtle p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3 text-xl font-bold tracking-normal">
            {icon}
            <span>{title}</span>
          </div>
          {description && (
            <p
              className={cn(
                "mt-2 text-base font-bold text-secondary",
                truncateDescription && "truncate"
              )}
            >
              {description}
            </p>
          )}
        </div>

        {children}
      </div>
    </section>
  )
}
