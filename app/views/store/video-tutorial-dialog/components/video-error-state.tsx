import { RotateCcw, VideoOff } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "~/core"

export function VideoErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation(["app", "common"])

  return (
    <div className="absolute inset-0 grid place-items-center bg-default px-8">
      <div className="flex max-w-2xl flex-col items-center gap-6 text-center">
        <VideoOff aria-hidden className="size-12 text-secondary" />
        <p className="text-xl/relaxed font-bold whitespace-pre-line text-primary">
          {t("videoTutorialLoadFailed")}
        </p>
        <Button
          variant="secondary"
          size="md"
          type="button"
          icon={<RotateCcw />}
          onClick={onRetry}
        >
          {t("common:actions.retry")}
        </Button>
      </div>
    </div>
  )
}
