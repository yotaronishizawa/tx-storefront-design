import { createLogger } from "~/config/logger"
import { readShelfState } from "~/domains/shelf"
import { readLanguage, translate } from "~/initializer/i18n"
import {
  describeGuideLane,
  findCellByLocationId,
  getShelfPosition,
  groupStockShelfLocations,
  isLocationUnused,
  type GuideLandmark,
  type LaneUpdate,
  type LayoutCabinet,
  type LayoutCell,
  type ShelfLocation,
} from "~/model/shelf"
import { getLocalizedSkuName } from "~/model/sku"

import { readRestockingState } from "../restocking-store"
import {
  countStillNeeded,
  ensureGuidePlan,
  findGuideTargetOn,
} from "./restock-guide"

/*
 * The restock study's voice: the drink and where it goes on a scan; on each
 * placement, in any lane, a chime (two notes in the planned lane, one
 * elsewhere) and how many more; the next lane when one fills; a warning for a
 * lane that is not in use. Spoken by the browser, so the wording can change
 * without new recordings.
 */

const logger = createLogger("Restock Guide Voice")

const SPEECH_LANGUAGES: Record<string, string> = {
  bn: "bn-BD",
  en: "en-US",
  ja: "ja-JP",
  ne: "ne-NP",
  zh: "zh-CN",
}

let audioContext: AudioContext | null = null

/** Browsers speak and play only after a tap; the first tap anywhere unlocks both. */
export function primeGuideVoice(): () => void {
  const unlock = () => {
    try {
      globalThis.speechSynthesis?.speak(new SpeechSynthesisUtterance(""))
      void getAudioContext()?.resume()
    } catch (caught) {
      logger.debug("voice unlock failed", { caught })
    }
  }
  const options: AddEventListenerOptions = { capture: true, once: true }
  document.addEventListener("pointerdown", unlock, options)
  return () => document.removeEventListener("pointerdown", unlock, options)
}

/** On an applied scan: the drink, then where to put it, or that it is enough. */
export function announceGuideOnScan(skuId: string) {
  const shelf = readShelfState()
  if (
    skuId in shelf.recommendationCounts &&
    countStillNeeded(
      skuId,
      shelf.recommendationCounts,
      shelf.stockLocations
    ) === 0
  ) {
    speak(translate("restockGuideVoiceEnough", { sku: skuName(skuId) }))
    return
  }
  const laneIds = ensureGuidePlan()
  const cabinets = groupStockShelfLocations(
    shelf.stockLocations,
    shelf.stockSpec
  )
  const sku = skuName(skuId)
  const target = findGuideTargetOn(cabinets, laneIds)
  if (!target) {
    speak(translate("restockGuideVoiceNone", { sku }))
    return
  }
  speak(
    translate("restockGuideVoiceScan", {
      place: describePlace(cabinets, target.cell, skuId),
      sku,
    })
  )
}

/**
 * On a drink placed with a drink scanned. Returns false when the update is
 * not a placement this guide speaks for.
 */
export function announceGuideOnPlacement({
  nextStockLocations,
  previousStockLocations,
  skuId,
  update,
}: {
  nextStockLocations: ShelfLocation[]
  previousStockLocations: ShelfLocation[]
  skuId: string
  update: LaneUpdate
}): boolean {
  const { stockSpec, recommendationCounts } = readShelfState()
  const before = groupStockShelfLocations(previousStockLocations, stockSpec)
  const after = groupStockShelfLocations(nextStockLocations, stockSpec)
  const placed = update.locationId
    ? findCellByLocationId(after, update.locationId)
    : undefined
  if (!placed?.location) {
    return false
  }
  if (isLocationUnused(placed.location)) {
    say("restockGuideVoiceUnusable")
    return true
  }

  // The plan as it stood before this drink: ensuring it now could replan.
  const { guidePlan } = readRestockingState()
  const laneIds = guidePlan.skuId === skuId ? guidePlan.laneIds : []
  const planned = findGuideTargetOn(before, laneIds)
  const inPlannedLane = planned?.cell.location?.id === placed.location.id
  // Two notes in the planned lane, one elsewhere; what is said is the same.
  playChime(inPlannedLane ? "target" : "other")

  const listed = skuId in recommendationCounts
  const left = countStillNeeded(skuId, recommendationCounts, nextStockLocations)
  if (listed && left === 0) {
    say("restockGuideVoiceDone")
    return true
  }
  if (inPlannedLane) {
    const next = findGuideTargetOn(after, ensureGuidePlan())
    // Only that the lane changed, not where: fast staff are already at the
    // next lane before a place could be said, so the screen shows where.
    if (next && next.cell.id !== placed.id) {
      say("restockGuideVoiceFull")
      return true
    }
  }
  if (listed) {
    speak(translate("restockGuideVoiceLeft", { count: left }))
  }
  return true
}

/** A red lane put right: said so, and how many are left to fix. */
/** Once the robot has stopped for a restock: take the iPad in and hang it up. */
export function announceCarryIn() {
  say("restockCarryInVoice")
}

export function announceLaneFixed(left: number) {
  if (left > 0) speak(translate("restockLaneFixedVoiceLeft", { count: left }))
  else say("restockLaneFixedVoiceAll")
}

/** Which shelf, then what to find the lane by: "右の棚、コーラのレーン". */
export function describePlace(
  cabinets: LayoutCabinet[],
  cell: LayoutCell,
  skuId: string
): string {
  const landmark = describeLandmark(
    describeGuideLane(cabinets, cell, skuId),
    skuId
  )
  const shelf = SHELF_KEYS[getShelfPosition(cabinets, cell.cabinet)]
  return shelf
    ? translate("restockGuidePlace", { landmark, shelf: translate(shelf) })
    : landmark
}

const SHELF_KEYS = {
  "": "",
  center: "restockGuideShelfCenter",
  left: "restockGuideShelfLeft",
  right: "restockGuideShelfRight",
} as const

export function describeLandmark(landmark: GuideLandmark, skuId: string) {
  switch (landmark.kind) {
    case "same-lane":
      return translate("restockGuideSameLane", { sku: skuName(skuId) })
    case "beside":
      if (landmark.distance > 1) {
        return translate(
          landmark.side === "right"
            ? "restockGuideRightOfBy"
            : "restockGuideLeftOfBy",
          { count: landmark.distance, sku: skuName(landmark.skuId) }
        )
      }
      return translate(
        landmark.side === "right"
          ? "restockGuideRightOf"
          : "restockGuideLeftOf",
        { sku: skuName(landmark.skuId) }
      )
    case "edge":
      return translate(
        landmark.side === "left"
          ? "restockGuideLeftEdge"
          : "restockGuideRightEdge"
      )
    case "from-left":
      return translate("restockGuideFromLeft", { count: landmark.count })
    case "from-right":
      return translate("restockGuideFromRight", { count: landmark.count })
  }
}

function skuName(skuId: string): string {
  const sku = readShelfState().skus.find((item) => item.id === skuId)
  return getLocalizedSkuName(sku, readLanguage()) || skuId
}

/**
 * The lines that never change, recorded once in Japanese (Azure's Nanami at
 * 1.15×, made with edge-tts): clearer than the browser's voice. Lines with a
 * drink, a place or a count stay with the browser, as do other languages.
 */
const RECORDED_JA = {
  restockCarryInVoice: "/voice/ja/carry-in.mp3",
  restockGuideVoiceUnusable: "/voice/ja/lane-unusable.mp3",
  restockLaneFixedVoiceAll: "/voice/ja/lanes-all-fixed.mp3",
  restockGuideVoiceFull: "/voice/ja/lane-full.mp3",
  restockGuideVoiceDone: "/voice/ja/drink-done.mp3",
} as const
type RecordedLine = keyof typeof RECORDED_JA

let playing: HTMLAudioElement | null = null

/** A fixed line: its recording in Japanese, else the browser's voice. */
function say(key: RecordedLine) {
  const clip = readLanguage() === "ja" ? RECORDED_JA[key] : undefined
  if (!clip || typeof Audio === "undefined") {
    speak(translate(key))
    return
  }
  // As with speech, the newest line replaces whatever is still playing.
  globalThis.speechSynthesis?.cancel()
  playing?.pause()
  playing = new Audio(clip)
  void playing.play().catch(() => speak(translate(key)))
}

function speak(text: string) {
  const synth = globalThis.speechSynthesis
  if (!synth || !text) {
    return
  }
  playing?.pause()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = SPEECH_LANGUAGES[readLanguage()] ?? "ja-JP"
  utterance.rate = 1.05
  // Each placement replaces what is still being said: the newest is what matters.
  synth.cancel()
  synth.speak(utterance)
}

function getAudioContext(): AudioContext | null {
  if (!audioContext && typeof AudioContext !== "undefined") {
    audioContext = new AudioContext()
  }
  return audioContext
}

/** Two rising notes for the planned lane, one low note anywhere else. */
function playChime(kind: "other" | "target") {
  const context = getAudioContext()
  if (!context) {
    return
  }
  const notes = kind === "target" ? [880, 1320] : [520]
  notes.forEach((frequency, index) => {
    const start = context.currentTime + index * 0.14
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(0.3, start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22)
    oscillator.connect(gain).connect(context.destination)
    oscillator.start(start)
    oscillator.stop(start + 0.25)
  })
}
