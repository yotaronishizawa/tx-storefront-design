import { useEffect, useMemo, useState } from "react"

import { Video } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Dialog } from "~/core"
import {
  getInitialVideoTutorial,
  type VideoTutorialCatalog,
  type VideoTutorialCatalogState,
  type VideoTutorialCategory,
} from "~/utils/video-tutorials"

import { TutorialList } from "./components/tutorial-list"
import { VideoPlayerPanel } from "./components/video-player-panel"
import { getVideoTitleKey, type VideoState } from "./utils/video-tutorial"

export function VideoTutorialDialog({
  catalog,
  catalogState,
  category,
  open,
  onClose,
}: {
  catalog: VideoTutorialCatalog
  catalogState: VideoTutorialCatalogState
  category: VideoTutorialCategory
  open: boolean
  onClose: () => void
}) {
  const { t } = useTranslation(["app", "common"])

  const [selectedVideoId, setSelectedVideoId] = useState("")
  const [videoState, setVideoState] = useState<VideoState>("idle")
  const [retryNonce, setRetryNonce] = useState(0)

  const translatedCatalog = useMemo(
    () => ({
      ...catalog,
      videos: catalog.videos.map((video) => {
        const titleKey = getVideoTitleKey(video.id)
        if (!titleKey) {
          return video
        }
        return { ...video, title: t(titleKey) }
      }),
    }),
    [catalog, t]
  )
  const videos = translatedCatalog.videos

  // Each load starts on the screen's own tutorial, not the last one watched.
  useEffect(() => {
    if (catalogState === "ready") {
      setSelectedVideoId(getInitialVideoTutorial(catalog, category).id)
    }
  }, [catalog, catalogState, category])

  const selectedVideo =
    videos.find((video) => video.id === selectedVideoId) ??
    getInitialVideoTutorial(translatedCatalog, category)
  const selectedVideoIndex = Math.max(
    videos.findIndex((video) => video.id === selectedVideo.id),
    0
  )

  useEffect(() => {
    if (!open) {
      return
    }

    if (!selectedVideo.videoUrl) {
      setVideoState("error")
      return
    }

    setVideoState("loading")
  }, [open, retryNonce, selectedVideo])

  return (
    <Dialog.Root
      className="grid h-full max-h-205 max-w-306 grid-rows-[auto_minmax(0,1fr)] overflow-hidden"
      inset="wide"
      layer="raised"
      open={open}
      onDismiss={onClose}
    >
      <header className="flex h-18 items-center justify-between gap-4 border-b px-6">
        <Dialog.Title className="flex min-w-0 items-center gap-3 leading-none font-bold">
          <Video className="size-4 shrink-0 text-info" />
          <span className="truncate">{t("videoTutorialTitle")}</span>
        </Dialog.Title>
        <Dialog.Close aria-label={t("closeVideoTutorial")} />
      </header>

      <div className="grid min-h-0 grid-cols-1 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <TutorialList
          catalogState={catalogState}
          selectedVideoId={selectedVideo.id}
          videos={videos}
          onSelect={(video) => {
            setSelectedVideoId(video.id)
            setRetryNonce(0)
          }}
        />

        <VideoPlayerPanel
          key={`${selectedVideo.id}-${retryNonce}`}
          selectedVideo={selectedVideo}
          selectedVideoIndex={selectedVideoIndex}
          state={videoState}
          onError={() => setVideoState("error")}
          onLoaded={() => setVideoState("ready")}
          onRetry={() => {
            setRetryNonce((current) => current + 1)
            setVideoState(selectedVideo.videoUrl ? "loading" : "error")
          }}
        />
      </div>
    </Dialog.Root>
  )
}
