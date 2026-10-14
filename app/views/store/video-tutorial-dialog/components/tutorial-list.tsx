import { Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "~/core"
import { cn } from "~/utils/cn"
import type {
  VideoTutorial,
  VideoTutorialCatalogState,
} from "~/utils/video-tutorials"

import { formatTutorialTitle } from "../utils/video-tutorial"

export function TutorialList({
  catalogState,
  selectedVideoId,
  videos,
  onSelect,
}: {
  catalogState: VideoTutorialCatalogState
  selectedVideoId: string
  videos: VideoTutorial[]
  onSelect: (video: VideoTutorial) => void
}) {
  const { t } = useTranslation("app")

  const loading = catalogState === "loading"

  return (
    <aside className="min-h-0 overflow-hidden bg-default lg:border-r">
      <div className="h-full overflow-y-auto p-4">
        {loading && (
          <div className="grid h-24 place-items-center text-secondary">
            <Loader2 className="size-7 animate-spin" />
          </div>
        )}

        <div className={cn("grid gap-2", loading && "opacity-30")}>
          {videos.map((video, index) => {
            const selected = video.id === selectedVideoId
            return (
              <Button
                variant="unstyled"
                size="unstyled"
                key={video.id}
                className={cn(
                  "flex min-h-12 justify-start rounded-md px-3 py-2 text-left text-base/tight font-bold whitespace-normal transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                  selected
                    ? "bg-primary-subtle text-primary-text"
                    : "text-primary active:bg-muted"
                )}
                type="button"
                onClick={() => onSelect(video)}
              >
                {formatTutorialTitle(video.title, index)}
              </Button>
            )
          })}
        </div>

        {videos.length === 0 && !loading && (
          <p className="mt-10 text-center text-sm font-bold text-secondary">
            {t("videoTutorialEmpty")}
          </p>
        )}
      </div>
    </aside>
  )
}
