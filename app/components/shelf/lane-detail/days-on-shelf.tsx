import { useTranslation } from "react-i18next"

import { cn } from "~/utils/cn"

/** "10日経過" with the number enlarged: the operator reads it from across the shelf. */
export function DaysOnShelf({ aged, days }: { aged: boolean; days: number }) {
  const { i18n, t } = useTranslation("app")
  const text = t("laneDrinkDaysOnShelf", { days })
  // ICU formats the count in the language's own digits, so split on that rendering.
  const count = new Intl.NumberFormat(i18n.language).format(days)
  const at = text.indexOf(count)

  return (
    <span
      className={cn("text-xs font-bold text-secondary", aged && "text-warning")}
    >
      {at === -1 ? (
        text
      ) : (
        <>
          {text.slice(0, at)}
          <span className="text-base font-bold text-primary">{count}</span>
          {text.slice(at + count.length)}
        </>
      )}
    </span>
  )
}
