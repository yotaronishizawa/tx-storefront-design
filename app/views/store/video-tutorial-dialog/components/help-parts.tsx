import type { ReactNode } from "react"

import { BookOpen, Play } from "lucide-react"
import { useTranslation } from "react-i18next"

import { ChoiceCard } from "~/core"
import type { ManualPage } from "~/utils/manual-search"
import type { VideoTutorial } from "~/utils/video-tutorials"

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-base font-bold text-secondary">{children}</h3>
}

/** A video as a card: its first frames as the picture, the title under it. */
export function VideoCard({
  video,
  onOpen,
}: {
  video: VideoTutorial
  onOpen: () => void
}) {
  return (
    <ChoiceCard
      layout="media"
      className="size-full"
      onClick={onOpen}
      title={video.title}
      media={
        <span className="relative block aspect-video w-full bg-inverse">
          {video.videoUrl && (
            <video
              aria-hidden="true"
              muted
              playsInline
              preload="metadata"
              src={`${video.videoUrl}#t=2`}
              className="size-full object-cover opacity-80"
            />
          )}
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid size-12 place-items-center rounded-full bg-default/90">
              <Play aria-hidden="true" className="ms-0.5 size-6 fill-current" />
            </span>
          </span>
        </span>
      }
    />
  )
}

/** A manual page as a card: the slide title, then which document it is in. */
export function PageCard({
  at,
  onOpen,
  detail,
}: {
  at: ManualPage
  onOpen: () => void
  /** Optional lines under the title (a search snippet). */
  detail?: ReactNode
}) {
  const { t } = useTranslation("app")
  const { doc, page } = at
  return (
    <ChoiceCard
      size="sm"
      onClick={onOpen}
      title={doc.headings[page] || doc.title}
      description={
        <span className="flex flex-col gap-1">
          {detail}
          <span className="flex items-center gap-1.5">
            <BookOpen aria-hidden="true" className="size-4" />
            {doc.title}・{t("manualSearch.page", { page: page + 1 })}
          </span>
        </span>
      }
    />
  )
}
