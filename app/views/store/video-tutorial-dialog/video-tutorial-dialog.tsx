import { useEffect, useMemo, useState, type ReactNode } from "react"

import {
  BookOpen,
  ChevronLeft,
  CircleHelp,
  LifeBuoy,
  Phone,
  PlayCircle,
  Search,
  Target,
  X,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { useLocation } from "react-router"

import { OPERATIONS_CENTER_PHONE } from "~/config/app"
import { Button, Dialog, Input } from "~/core"
import { cn } from "~/utils/cn"
import {
  loadManualIndex,
  manualPicksFor,
  searchManual,
  searchVideos,
  troublePagesOf,
  videoPicksFor,
  type ManualDoc,
  type ManualPage,
} from "~/utils/manual-search"
import { normalizePathname } from "~/utils/pathname"
import type {
  VideoTutorial,
  VideoTutorialCatalog,
  VideoTutorialCatalogState,
  VideoTutorialCategory,
} from "~/utils/video-tutorials"

import { DeckReader } from "./components/deck-reader"
import {
  ContactStrip,
  Highlighted,
  PageCard,
  SectionTitle,
  VideoCard,
} from "./components/help-parts"
import { VideoPlayerPanel } from "./components/video-player-panel"
import { getVideoTitleKey, type VideoState } from "./utils/video-tutorial"

type Section = "screen" | "videos" | "manual" | "trouble" | "contact"

/** What fills the right side over a section: a video, or a manual page. */
type Open =
  | { kind: "video"; video: VideoTutorial }
  | { kind: "page"; at: ManualPage }
  | null

const MAX_PAGE_HITS = 20

/**
 * The help: one place for the tutorial videos and the CX manual, read in the
 * app. Left, where to look (this screen first); right, what is there. Staff
 * watch the videos more than they read, so videos lead. A search finds both.
 * The operations centre's number closes every section.
 */
export function VideoTutorialDialog({
  catalog,
  catalogState,
  open,
  onClose,
}: {
  catalog: VideoTutorialCatalog
  catalogState: VideoTutorialCatalogState
  /** Kept for the shell; the help now reads the screen from the URL. */
  category?: VideoTutorialCategory
  open: boolean
  onClose: () => void
}) {
  const { t } = useTranslation(["app", "common"])
  const pathname = normalizePathname(useLocation().pathname)
  const [section, setSection] = useState<Section>("screen")
  const [query, setQuery] = useState("")
  const [opened, setOpened] = useState<Open>(null)
  const [docs, setDocs] = useState<ManualDoc[]>([])
  const [videoState, setVideoState] = useState<VideoState>("idle")
  const [retryNonce, setRetryNonce] = useState(0)

  // Each opening starts on this screen, with nothing typed.
  useEffect(() => {
    if (!open) return
    setSection("screen")
    setQuery("")
    setOpened(null)
  }, [open])

  useEffect(() => {
    let alive = true
    void loadManualIndex().then((loaded) => {
      if (alive) setDocs(loaded)
    })
    return () => {
      alive = false
    }
  }, [])

  const videos = useMemo(
    () =>
      catalog.videos.map((video) => {
        const titleKey = getVideoTitleKey(video.id)
        return titleKey ? { ...video, title: t(titleKey) } : video
      }),
    [catalog, t]
  )

  const typed = query.trim()
  const videoHits = useMemo(() => searchVideos(videos, typed), [videos, typed])
  const pageHits = useMemo(
    () => searchManual(docs, typed).slice(0, MAX_PAGE_HITS),
    [docs, typed]
  )

  const openVideo = (video: VideoTutorial) => {
    setOpened({ kind: "video", video })
    setRetryNonce(0)
    setVideoState(video.videoUrl ? "loading" : "error")
  }
  const openPage = (at: ManualPage) => setOpened({ kind: "page", at })
  const backLabel = typed
    ? t("manualSearch.back")
    : t(`help.nav.${section}` as const)

  const nav: { key: Section; icon: ReactNode }[] = [
    { key: "screen", icon: <Target className="size-5" /> },
    { key: "videos", icon: <PlayCircle className="size-5" /> },
    { key: "manual", icon: <BookOpen className="size-5" /> },
    { key: "trouble", icon: <LifeBuoy className="size-5" /> },
  ]
  const goTo = (key: Section) => {
    setSection(key)
    setQuery("")
    setOpened(null)
  }

  return (
    <Dialog.Root
      className="grid h-full max-h-205 max-w-306 grid-rows-[auto_minmax(0,1fr)] overflow-hidden"
      inset="wide"
      layer="raised"
      open={open}
      onDismiss={onClose}
    >
      <header className="flex h-20 items-center gap-4 border-b px-6">
        <Dialog.Title className="flex shrink-0 items-center gap-3 leading-none font-bold">
          <CircleHelp className="size-5 shrink-0 text-info" />
          {t("howToUse")}
        </Dialog.Title>
        <label className="ms-6 flex h-13 min-w-0 flex-1 items-center gap-3 rounded-full border-2 border-black/20 px-5 focus-within:border-strong">
          <Search
            aria-hidden="true"
            className="size-5 shrink-0 text-secondary"
          />
          <Input
            value={query}
            onValueChange={(next) => {
              setQuery(next)
              setOpened(null)
            }}
            placeholder={t("help.searchPlaceholder")}
            aria-label={t("help.searchPlaceholder")}
            className="h-full flex-1 text-lg"
          />
          {query && (
            <Button
              variant="unstyled"
              size="unstyled"
              type="button"
              aria-label={t("manualSearch.clear")}
              onClick={() => setQuery("")}
              className="grid size-9 shrink-0 place-items-center rounded-full active:bg-subtle"
            >
              <X aria-hidden="true" className="size-5" />
            </Button>
          )}
        </label>
        <Dialog.Close aria-label={t("closeVideoTutorial")} />
      </header>

      <div className="grid min-h-0 grid-cols-[14rem_minmax(0,1fr)]">
        <nav className="flex min-h-0 flex-col gap-1 border-e p-3">
          {nav.map(({ key, icon }) => (
            <NavItem
              key={key}
              icon={icon}
              active={!typed && section === key}
              onClick={() => goTo(key)}
            >
              {t(`help.nav.${key}` as const)}
            </NavItem>
          ))}
          <div className="flex-1" />
          <NavItem
            icon={<Phone className="size-5" />}
            active={!typed && section === "contact"}
            onClick={() => goTo("contact")}
          >
            {t("help.nav.contact")}
          </NavItem>
        </nav>

        <div className="min-h-0 overflow-hidden">
          {opened?.kind === "page" ? (
            <DeckReader
              doc={opened.at.doc}
              page={opened.at.page}
              onPage={(page) =>
                setOpened({ kind: "page", at: { doc: opened.at.doc, page } })
              }
              onBack={() => setOpened(null)}
              backLabel={backLabel}
            />
          ) : opened?.kind === "video" ? (
            <div className="flex h-full min-h-0 flex-col">
              <BackBar label={backLabel} onBack={() => setOpened(null)} />
              <VideoPlayerPanel
                key={`${opened.video.id}-${retryNonce}`}
                selectedVideo={opened.video}
                selectedVideoIndex={Math.max(
                  videos.findIndex((video) => video.id === opened.video.id),
                  0
                )}
                state={videoState}
                onError={() => setVideoState("error")}
                onLoaded={() => setVideoState("ready")}
                onRetry={() => {
                  setRetryNonce((current) => current + 1)
                  setVideoState(opened.video.videoUrl ? "loading" : "error")
                }}
              />
            </div>
          ) : (
            <div className="grid h-full content-start gap-6 overflow-y-auto p-6">
              {typed ? (
                <Results
                  query={typed}
                  videos={videoHits}
                  pages={pageHits}
                  onVideo={openVideo}
                  onPage={openPage}
                />
              ) : section === "screen" ? (
                <>
                  <VideoGrid
                    title={t("help.screenVideos")}
                    videos={videoPicksFor(videos, pathname)}
                    onVideo={openVideo}
                  />
                  <PageGrid
                    title={t("manualSearch.picksHeading")}
                    pages={manualPicksFor(docs, pathname)}
                    onPage={openPage}
                  />
                </>
              ) : section === "videos" ? (
                <VideoGrid
                  title={t("help.allVideos")}
                  videos={videos}
                  loading={catalogState === "loading"}
                  onVideo={openVideo}
                />
              ) : section === "manual" ? (
                <section className="grid gap-3">
                  <SectionTitle>{t("manualSearch.library")}</SectionTitle>
                  <div className="grid grid-cols-2 gap-2">
                    {docs.map((doc) => (
                      <Button
                        key={doc.key}
                        variant="unstyled"
                        size="unstyled"
                        type="button"
                        onClick={() => openPage({ doc, page: 0 })}
                        className="flex w-full items-center gap-3 rounded-lg border border-black/20 px-4 py-3 text-left whitespace-normal active:bg-subtle"
                      >
                        <BookOpen
                          aria-hidden="true"
                          className="size-5 shrink-0 text-secondary"
                        />
                        <span className="flex-1 text-lg/tight font-bold">
                          {doc.title}
                        </span>
                        <span className="text-sm text-secondary">
                          {t("manualSearch.pageCount", {
                            count: doc.pages.length,
                          })}
                        </span>
                      </Button>
                    ))}
                  </div>
                </section>
              ) : section === "trouble" ? (
                <PageGrid
                  title={t("help.troublePages")}
                  pages={troublePagesOf(docs)}
                  onPage={openPage}
                />
              ) : (
                <section className="grid gap-3">
                  <SectionTitle>{t("help.nav.contact")}</SectionTitle>
                  <p className="text-lg">{t("help.contactLead")}</p>
                  <a
                    href={`tel:${OPERATIONS_CENTER_PHONE}`}
                    className="text-display/tight font-bold"
                  >
                    {OPERATIONS_CENTER_PHONE}
                  </a>
                </section>
              )}
              {(section !== "contact" || typed) && <ContactStrip />}
            </div>
          )}
        </div>
      </div>
    </Dialog.Root>
  )
}

function NavItem({
  icon,
  active,
  onClick,
  children,
}: {
  icon: ReactNode
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Button
      variant="unstyled"
      size="unstyled"
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-12 items-center justify-start gap-3 rounded-md px-3 text-lg font-bold",
        active
          ? "bg-primary-subtle text-primary-text"
          : "text-secondary active:bg-subtle"
      )}
    >
      <span aria-hidden="true">{icon}</span>
      {children}
    </Button>
  )
}

function BackBar({ label, onBack }: { label: string; onBack: () => void }) {
  return (
    <div className="border-b px-4 py-2">
      <Button
        variant="unstyled"
        size="unstyled"
        type="button"
        onClick={onBack}
        className="flex min-h-11 items-center gap-1 rounded-md ps-1 pe-3 text-base font-bold text-secondary active:bg-subtle"
      >
        <ChevronLeft aria-hidden="true" className="size-5" />
        {label}
      </Button>
    </div>
  )
}

function VideoGrid({
  title,
  videos,
  loading = false,
  onVideo,
}: {
  title: string
  videos: VideoTutorial[]
  loading?: boolean
  onVideo: (video: VideoTutorial) => void
}) {
  if (videos.length === 0 && !loading) return null
  return (
    <section className="grid gap-3">
      <SectionTitle>{title}</SectionTitle>
      <div className={cn("grid grid-cols-3 gap-3", loading && "opacity-30")}>
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            onOpen={() => onVideo(video)}
          />
        ))}
      </div>
    </section>
  )
}

function PageGrid({
  title,
  pages,
  onPage,
}: {
  title: string
  pages: ManualPage[]
  onPage: (at: ManualPage) => void
}) {
  if (pages.length === 0) return null
  return (
    <section className="grid gap-3">
      <SectionTitle>{title}</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        {pages.map((at) => (
          <PageCard
            key={`${at.doc.key}-${at.page}`}
            at={at}
            onOpen={() => onPage(at)}
          />
        ))}
      </div>
    </section>
  )
}

function Results({
  query,
  videos,
  pages,
  onVideo,
  onPage,
}: {
  query: string
  videos: VideoTutorial[]
  pages: ReturnType<typeof searchManual>
  onVideo: (video: VideoTutorial) => void
  onPage: (at: ManualPage) => void
}) {
  const { t } = useTranslation("app")
  if (videos.length === 0 && pages.length === 0) {
    return (
      <p className="text-xl font-bold">{t("manualSearch.noHits", { query })}</p>
    )
  }
  return (
    <>
      <VideoGrid
        title={t("help.videoResults", { count: videos.length })}
        videos={videos}
        onVideo={onVideo}
      />
      {pages.length > 0 && (
        <section className="grid gap-3">
          <SectionTitle>
            {t("help.pageResults", { count: pages.length })}
          </SectionTitle>
          <div className="grid gap-2">
            {pages.map((hit) => (
              <PageCard
                key={`${hit.doc.key}-${hit.page}`}
                at={hit}
                onOpen={() => onPage(hit)}
                detail={
                  <span className="line-clamp-2 text-base/snug text-secondary">
                    <Highlighted {...hit.snippet} />
                  </span>
                }
              />
            ))}
          </div>
        </section>
      )}
    </>
  )
}
