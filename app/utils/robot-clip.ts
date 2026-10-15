/**
 * The robot clip to play, with its transparency kept. Apple's engine
 * (Safari, and every iPad browser) shows HEVC with alpha (`.mov`); others
 * (Chrome, Edge, Firefox) show VP9 with alpha (`.webm`). Each must get its
 * own file: iPad Safari also plays WebM but drops its alpha, and desktop
 * Chrome also plays HEVC but drops its alpha, leaving a grey box either way.
 */
export function robotClipSrc(clip: "normal" | "resting" | "trouble"): string {
  const ua = typeof navigator === "undefined" ? "" : navigator.userAgent
  const appleEngine =
    /AppleWebKit/.test(ua) && !/Chrome\/|Chromium|Edg\//.test(ua)
  return `/assets/home-study-2026-10-06/robot-${clip}.${appleEngine ? "mov" : "webm"}`
}
