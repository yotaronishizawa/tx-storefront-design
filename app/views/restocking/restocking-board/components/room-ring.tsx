import { useTranslation } from "react-i18next"

const SIZE = 208
const STROKE = 16
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/**
 * How many more to bring, large, inside a ring of how far along it is: the
 * one thing the pictures cannot show. The ring grows with each drink, so a
 * placement shows even from across the walk-in.
 */
export function RoomRing({ count, total }: { count: number; total: number }) {
  const { t } = useTranslation("app")
  const filled = total > 0 ? Math.min(1, Math.max(0, 1 - count / total)) : 0

  return (
    <div className="relative size-47 shrink-0">
      <svg
        aria-hidden
        className="size-full -rotate-90"
        viewBox={`0 0 ${SIZE} ${SIZE}`}
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          fill="none"
          r={RADIUS}
          stroke="var(--border-color-default)"
          strokeWidth={STROKE}
        />
        <circle
          className="transition-[stroke-dashoffset] duration-500 ease-out"
          cx={SIZE / 2}
          cy={SIZE / 2}
          fill="none"
          r={RADIUS}
          stroke="var(--color-success)"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - filled)}
          strokeLinecap="round"
          strokeWidth={STROKE}
        />
      </svg>
      <p className="absolute inset-0 flex flex-col items-center justify-center font-bold text-success">
        <span className="text-xl/tight">{t("restockGuideRingLabel")}</span>
        <span className="text-[5rem]/none">{count}</span>
        <span className="text-xl/tight">{t("restockGuideRingUnit")}</span>
      </p>
    </div>
  )
}
