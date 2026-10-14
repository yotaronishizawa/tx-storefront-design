import { cn } from "~/utils/cn"
import type { VideoTutorial } from "~/utils/video-tutorials"

import { formatTutorialTitle, type VideoState } from "../utils/video-tutorial"
import { VideoErrorState } from "./video-error-state"
import { VideoLoadingState } from "./video-loading-state"

export function VideoPlayerPanel({
  selectedVideo,
  selectedVideoIndex,
  state,
  onError,
  onLoaded,
  onRetry,
}: {
  selectedVideo: VideoTutorial
  selectedVideoIndex: number
  state: VideoState
  onError: () => void
  onLoaded: () => void
  onRetry: () => void
}) {
  const hasVideo = Boolean(selectedVideo.videoUrl)
  const loading = state === "loading" || state === "idle"

  return (
    <section className="flex min-h-0 flex-col gap-4 overflow-auto bg-default p-6">
      <h3 className="text-xl/tight font-bold text-primary">
        {formatTutorialTitle(selectedVideo.title, selectedVideoIndex)}
      </h3>

      <div className="relative aspect-video w-full max-w-222.5 overflow-hidden rounded-lg border bg-inverse">
        {hasVideo && (
          <video
            className={cn(
              "size-full object-contain",
              state === "ready" ? "opacity-100" : "opacity-0"
            )}
            controls
            playsInline
            preload="metadata"
            src={selectedVideo.videoUrl}
            onCanPlay={onLoaded}
            onError={onError}
            onLoadedData={onLoaded}
          />
        )}

        {loading && <VideoLoadingState title={selectedVideo.title} />}

        {state === "error" && <VideoErrorState onRetry={onRetry} />}
      </div>
    </section>
  )
}
