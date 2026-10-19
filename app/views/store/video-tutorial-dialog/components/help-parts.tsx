import type { ReactNode } from "react"

import { BookOpen, Phone, Play } from "lucide-react"
import { useTranslation } from "react-i18next"

import { OPERATIONS_CENTER_PHONE } from "~/config/app"
import { Button } from "~/core"
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
    <Button
      variant="unstyled"
      size="unstyled"
      type="button"
      onClick={onOpen}
      className="flex size-full min-w-0 flex-col items-stretch justify-start overflow-hidden rounded-lg border border-black/20 text-left whitespace-normal active:bg-subtle"
    >
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
      <span className="p-3 text-lg/tight font-bold">{video.title}</span>
    </Button>
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
    <Button
      variant="unstyled"
      size="unstyled"
      type="button"
      onClick={onOpen}
      className="flex w-full min-w-0 flex-col items-start justify-center gap-1 rounded-lg border border-black/20 px-4 py-3 text-left whitespace-normal active:bg-subtle"
    >
      <span className="text-lg/tight font-bold">
        {doc.headings[page] || doc.title}
      </span>
      {detail}
      <span className="flex items-center gap-1.5 text-sm text-secondary">
        <BookOpen aria-hidden="true" className="size-4" />
        {doc.title}・{t("manualSearch.page", { page: page + 1 })}
      </span>
    </Button>
  )
}

/** The way out when nothing here helps; under every section. */
export function ContactStrip() {
  const { t } = useTranslation("app")
  return (
    <a
      href={`tel:${OPERATIONS_CENTER_PHONE}`}
      className="flex items-center gap-3 rounded-lg bg-subtle px-4 py-3 text-base font-bold"
    >
      <Phone aria-hidden="true" className="size-5 shrink-0" />
      {t("manualSearch.callCenter", { phone: OPERATIONS_CENTER_PHONE })}
    </a>
  )
}

export function Highlighted({
  text,
  marks,
}: {
  text: string
  marks: [number, number][]
}) {
  const parts: ReactNode[] = []
  let at = 0
  marks.forEach(([from, to], index) => {
    if (from < at) return
    parts.push(text.slice(at, from))
    parts.push(
      <b key={index} className="font-bold text-primary">
        {text.slice(from, to)}
      </b>
    )
    at = to
  })
  parts.push(text.slice(at))
  return <>{parts}</>
}
