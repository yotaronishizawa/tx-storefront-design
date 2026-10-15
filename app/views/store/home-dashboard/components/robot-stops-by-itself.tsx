import { Power } from "lucide-react"
import { useTranslation } from "react-i18next"

import { cn } from "~/utils/cn"

/**
 * "Pick a task and the robot stops by itself", with the same power mark as
 * the header's stop button, so staff who look for a way to stop the robot
 * first see that the tasks already do it. Shown only while it is working.
 */
export function RobotStopsByItself({ className }: { className?: string }) {
  const { t } = useTranslation("app")
  return (
    <p
      className={cn(
        "flex items-center gap-3 font-bold text-primary",
        className
      )}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-on-primary">
        <Power className="size-5" strokeWidth={2.5} />
      </span>
      {t("workflow.home.robotStopsByItself")}
    </p>
  )
}
