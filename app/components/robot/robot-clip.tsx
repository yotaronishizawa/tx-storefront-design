import { useEffect, useRef } from "react"

export type RobotClipName = "normal" | "resting" | "trouble"

const CLIP_DIR = "/assets/home-study-2026-10-06"

/**
 * The robot drawn moving, with a transparent background. Chrome, Edge and
 * Firefox play VP9 with alpha (`.webm`). Apple's engine (Safari, and every
 * iPad browser) drew the HEVC-with-alpha clip on a solid box on the store
 * iPad, and drops WebM's alpha, so it gets an animated PNG instead: heavier
 * (about 10 MB a clip) but transparent everywhere.
 */
export function RobotClip({
  clip,
  className,
}: {
  clip: RobotClipName
  className?: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  // Browsers pause autoplay while the page is hidden; resume when the tablet comes back.
  useEffect(() => {
    const resume = () => {
      if (document.visibilityState === "visible")
        void videoRef.current?.play().catch(() => {})
    }
    document.addEventListener("visibilitychange", resume)
    return () => document.removeEventListener("visibilitychange", resume)
  }, [])

  if (usesAppleEngine())
    return (
      <img
        key={clip}
        src={`${CLIP_DIR}/robot-${clip}-anim.png`}
        alt=""
        aria-hidden="true"
        draggable={false}
        className={className}
      />
    )
  return (
    <video
      key={clip}
      ref={videoRef}
      aria-hidden="true"
      autoPlay
      loop
      muted
      playsInline
      disablePictureInPicture
      className={className}
      src={`${CLIP_DIR}/robot-${clip}.webm`}
    />
  )
}

function usesAppleEngine(): boolean {
  const ua = typeof navigator === "undefined" ? "" : navigator.userAgent
  return /AppleWebKit/.test(ua) && !/Chrome\/|Chromium|Edg\//.test(ua)
}
