import { z } from "zod"

import { VIDEO_TUTORIAL_CONFIG_URL } from "~/config/env"
import { ROUTES } from "~/config/routes"
import {
  FALLBACK_VIDEO_TUTORIAL_PANELS,
  FALLBACK_VIDEO_TUTORIALS,
  VIDEO_TUTORIAL_CATEGORIES,
  type VideoTutorial,
  type VideoTutorialCategory,
  type VideoTutorialPanel,
} from "~/config/video-tutorials"

import { normalizePathname } from "./pathname"

export type { VideoTutorial, VideoTutorialCategory }

export type VideoTutorialCatalog = {
  panels: VideoTutorialPanel[]
  videos: VideoTutorial[]
}

export type VideoTutorialCatalogState = "idle" | "loading" | "ready"

// The store app's `VideoTutorial` remote config, read forgivingly: a bad row is dropped, not the catalog.
const remoteVideoSchema = z.looseObject({
  VideoKey: z.string().catch(""),
  Title: z.string().catch(""),
  StreamingURL: z.string().catch(""),
  /** The `VideoKey` this video replaces in a Pico scanner store. */
  PicoScannerVariantOf: z.string().catch(""),
})

const remotePanelSchema = z.looseObject({
  PanelType: z.string().catch(""),
  VideoKey: z.string().catch(""),
})

const remoteCatalogSchema = z.looseObject({
  Videos: z.array(z.unknown()).catch([]),
  Panels: z.array(z.unknown()).catch([]),
})

type RemoteVideo = z.infer<typeof remoteVideoSchema>

// Older store app versions need it to tell a Pico video from the one it replaces.
const PICO_SCANNER_TITLE_PREFIX = "新しいスキャナーでの"

export function getFallbackVideoTutorialCatalog(): VideoTutorialCatalog {
  return {
    panels: FALLBACK_VIDEO_TUTORIAL_PANELS,
    videos: FALLBACK_VIDEO_TUTORIALS,
  }
}

/**
 * The catalog at `VIDEO_TUTORIAL_CONFIG_URL`, or the built-in one when the URL
 * is unset, unreachable or unreadable. Never rejects.
 */
export async function loadVideoTutorialCatalog(): Promise<VideoTutorialCatalog> {
  if (!VIDEO_TUTORIAL_CONFIG_URL) {
    return getFallbackVideoTutorialCatalog()
  }

  try {
    const response = await fetch(VIDEO_TUTORIAL_CONFIG_URL, {
      cache: "no-store",
    })
    return (
      parseVideoTutorialCatalog(await response.json()) ??
      getFallbackVideoTutorialCatalog()
    )
  } catch {
    return getFallbackVideoTutorialCatalog()
  }
}

function parseVideoTutorialCatalog(
  value: unknown
): VideoTutorialCatalog | null {
  const root = remoteCatalogSchema.safeParse(value)
  if (!root.success) {
    return null
  }

  const remoteVideos = root.data.Videos.flatMap((item) => {
    const video = remoteVideoSchema.safeParse(item)
    if (!video.success || !video.data.VideoKey || !video.data.Title) {
      return []
    }
    return [video.data]
  })
  const videos = applyPicoScannerVariants(remoteVideos)
  if (videos.length === 0) {
    return null
  }

  const panels = root.data.Panels.flatMap((item) => {
    const panel = remotePanelSchema.safeParse(item)
    if (
      !panel.success ||
      !isVideoTutorialCategory(panel.data.PanelType) ||
      !panel.data.VideoKey
    ) {
      return []
    }
    return [{ panelType: panel.data.PanelType, videoKey: panel.data.VideoKey }]
  })
  return { panels, videos }
}

/**
 * Every store scans with a Pico, so a Pico video always takes the place of the
 * one it names, keeping that video's key so `Panels` still point at it.
 */
function applyPicoScannerVariants(videos: RemoteVideo[]): VideoTutorial[] {
  const variantByKey = new Map<string, RemoteVideo>()
  for (const video of videos) {
    if (video.PicoScannerVariantOf) {
      variantByKey.set(video.PicoScannerVariantOf, video)
    }
  }

  return videos
    .filter((video) => !video.PicoScannerVariantOf)
    .map((video) => {
      const variant = variantByKey.get(video.VideoKey)
      if (!variant) {
        return toVideoTutorial(video.VideoKey, video.Title, video.StreamingURL)
      }
      const title = variant.Title.normalize("NFC")
      return toVideoTutorial(
        video.VideoKey,
        title.startsWith(PICO_SCANNER_TITLE_PREFIX)
          ? title.slice(PICO_SCANNER_TITLE_PREFIX.length)
          : title,
        variant.StreamingURL
      )
    })
}

function toVideoTutorial(
  id: string,
  title: string,
  videoUrl: string
): VideoTutorial {
  return { id, title: title.normalize("NFC"), videoUrl }
}

function isVideoTutorialCategory(
  value: string
): value is VideoTutorialCategory {
  return (VIDEO_TUTORIAL_CATEGORIES as readonly string[]).includes(value)
}

/** The video a category opens on, or the catalog's first video when none is mapped. */
export function getInitialVideoTutorial(
  catalog: VideoTutorialCatalog,
  category: VideoTutorialCategory
): VideoTutorial {
  const panel = catalog.panels.find((item) => item.panelType === category)
  if (!panel) {
    return catalog.videos[0]
  }

  const video = catalog.videos.find((item) => item.id === panel.videoKey)
  return video ?? catalog.videos[0]
}

/** Typed over `ROUTES`, so a new route fails to compile until it picks a category. */
const CATEGORY_BY_ROUTE: Record<keyof typeof ROUTES, VideoTutorialCategory> = {
  display: "DisplayLayout",
  edit: "UpdateShelves",
  home: "InitialPage",
  login: "InitialPage",
  manual: "ManualReplenishment",
  recommendations: "Target",
  restocking: "Modification",
  restockStart: "Modification",
  stock: "Modification",
  settings: "Settings",
  walkIn: "RobotControl",
  workReport: "InitialPage",
}

const CATEGORY_BY_PATHNAME: Record<string, VideoTutorialCategory> =
  Object.fromEntries(
    Object.entries(CATEGORY_BY_ROUTE).map(([name, category]) => [
      ROUTES[name as keyof typeof ROUTES]().pathname,
      category,
    ])
  )

export function getVideoTutorialCategory(
  pathname: string
): VideoTutorialCategory {
  return CATEGORY_BY_PATHNAME[normalizePathname(pathname)] ?? "InitialPage"
}
