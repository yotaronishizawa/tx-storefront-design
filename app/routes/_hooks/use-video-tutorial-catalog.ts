import { useEffect, useState } from "react"

import {
  getFallbackVideoTutorialCatalog,
  loadVideoTutorialCatalog,
  type VideoTutorialCatalog,
  type VideoTutorialCatalogState,
} from "~/utils/video-tutorials"

/** Fetches the tutorial catalog again each time the dialog opens. */
export function useVideoTutorialCatalog(open: boolean) {
  const [catalog, setCatalog] = useState<VideoTutorialCatalog>(
    getFallbackVideoTutorialCatalog
  )
  const [state, setState] = useState<VideoTutorialCatalogState>("idle")

  useEffect(() => {
    if (!open) {
      return
    }

    let cancelled = false
    setState("loading")
    void loadVideoTutorialCatalog().then((nextCatalog) => {
      if (cancelled) {
        return
      }
      setCatalog(nextCatalog)
      setState("ready")
    })

    return () => {
      cancelled = true
    }
  }, [open])

  return { catalog, state }
}
