import { createLogger } from "~/config/logger"

const logger = createLogger("Store Audio")

const AUDIO_BASE_PATH = "/assets/audio"
const NOTIFICATION_PATH = `${AUDIO_BASE_PATH}/SE/notification.wav`

/** Sound effect keys; each plays `SE/<key>.mp3`. */
export const SoundEffects = {
  ManualDrinkFixed: "Error_MR_Drink_Fixed",
  RemoveDrinkSuccessfully: "Remove_Drink_Successfully",
} as const

/** Voice cue keys; each plays `Voice/<key>.mp3`. `Count` plays a number from `Voice/Numbers/`. */
export const AudioCues = {
  CanStartRestock: "can_start_restock",
  CanStartManualReplenishment: "can_start_manual_replenishment",
  CanStartManualReplenishmentAgedStock:
    "can_start_manual_replenishment_expired_drinks",
  ErrorAddedDrink: "error_added_drink",
  ErrorRemovedNotFirstDrink: "error_removed_not_first_drink",
  NoScannedItem: "no_scanned_item",
  NoRegisterDS: "no_register_DS",
  NoRegisterDB: "no_register_DB",
  FailedScan: "failed_scan",
  CannotReplenish: "cannot_replenish",
  ScanErrorDisconnected: "scan_error_disconnected",
  ScanErrorNoRestockTask: "scan_error_no_restock_task",
  ScanErrorServer: "scan_error_server",
  ScanErrorShelfClientTimeout: "scan_error_shelf_client_timeout",
  ScanErrorShelves: "scan_error_shelves",
  ScanErrorStockHasErrors: "scan_error_stock_has_errors",
  ScanErrorWeightStabilizationTimeout:
    "scan_error_weight_stabilization_timeout",
  /** Placeholder recording (a copy of `failed_scan`) until the real one is made. */
  ScanMultipleSkuSameJanCode: "scan_multiple_sku_same_jan_code",
  Count: (count: number) => String(count),
} as const

const VOICE_KEYS = new Set<string>(
  Object.values(AudioCues).filter((key) => typeof key === "string")
)

const SOUND_EFFECT_KEYS = new Set<string>(Object.values(SoundEffects))

const MIN_NUMBER_CUE = -1
const MAX_NUMBER_CUE = 200

const AUDIO_UNLOCK_EVENTS = [
  "pointerdown",
  "keydown",
  "mousedown",
  "touchstart",
] as const

const WAIT_FOR_CURRENT_AUDIO_MAX_MS = 5000

let currentAudio: HTMLAudioElement | null = null
let isAudioPrimed = false
let isBlockedWarningShown = false
let removeAudioUnlockListeners: (() => void) | undefined

/** The file for a cue key, or `""` when the key has none. */
function getStoreAudioPath(key: string): string {
  if (key === "notification") {
    return NOTIFICATION_PATH
  }
  if (SOUND_EFFECT_KEYS.has(key)) {
    return `${AUDIO_BASE_PATH}/SE/${key}.mp3`
  }
  if (VOICE_KEYS.has(key)) {
    return `${AUDIO_BASE_PATH}/Voice/${key}.mp3`
  }
  if (isNumberAudioKey(key)) {
    return `${AUDIO_BASE_PATH}/Voice/Numbers/${key}.mp3`
  }
  return ""
}

function isNumberAudioKey(key: string): boolean {
  if (!/^-?\d+$/.test(key)) {
    return false
  }

  const value = Number(key)
  return value >= MIN_NUMBER_CUE && value <= MAX_NUMBER_CUE
}

/**
 * Browsers block audio until a user gesture, so this primes a muted clip on the
 * first interaction. Returns the listener cleanup; safe to call repeatedly.
 */
export function initializeStoreAudioPlayback(): () => void {
  if (removeAudioUnlockListeners) {
    return removeAudioUnlockListeners
  }

  const eventOptions: AddEventListenerOptions = { capture: true, passive: true }

  function removeListeners() {
    for (const eventName of AUDIO_UNLOCK_EVENTS) {
      document.removeEventListener(eventName, unlockAudio, eventOptions)
    }
    removeAudioUnlockListeners = undefined
  }

  function unlockAudio() {
    void primeStoreAudioPlayback().then((primed) => {
      if (primed) {
        removeListeners()
      }
    })
  }

  for (const eventName of AUDIO_UNLOCK_EVENTS) {
    document.addEventListener(eventName, unlockAudio, eventOptions)
  }

  removeAudioUnlockListeners = removeListeners
  return removeListeners
}

/** Stops the current cue and plays `key`. Resolves `false` instead of throwing. */
export async function playStoreAudio(key: string): Promise<boolean> {
  const path = getStoreAudioPath(key)
  if (!path) {
    return false
  }

  currentAudio?.pause()
  currentAudio = new Audio(path)

  try {
    await currentAudio.play()
    isAudioPrimed = true
    return true
  } catch (error) {
    if (isErrorNamed(error, "NotAllowedError")) {
      logBlockedAudioOnce(key)
    } else if (!isErrorNamed(error, "AbortError")) {
      // An AbortError is a newer cue interrupting this one, which is intended.
      logger.warn(`Failed to play store audio '${key}'.`, error)
    }
    return false
  }
}

/** Lets the clip already playing finish first, so a lane cue never cuts off the scan cue before it. */
export async function playStoreAudioAfterCurrent(
  key: string
): Promise<boolean> {
  const playing = currentAudio
  if (playing && !playing.paused && !playing.ended) {
    await new Promise<void>((resolve) => {
      const done = () => resolve()
      playing.addEventListener("ended", done, { once: true })
      playing.addEventListener("pause", done, { once: true })
      window.setTimeout(done, WAIT_FOR_CURRENT_AUDIO_MAX_MS)
    })
  }
  return playStoreAudio(key)
}

async function primeStoreAudioPlayback(): Promise<boolean> {
  if (isAudioPrimed) {
    return true
  }

  const audio = new Audio(NOTIFICATION_PATH)
  audio.muted = true
  audio.preload = "auto"
  audio.volume = 0

  try {
    await audio.play()
    audio.pause()
    audio.currentTime = 0
    isAudioPrimed = true
    return true
  } catch (error) {
    if (!isErrorNamed(error, "NotAllowedError")) {
      logger.debug("Store audio could not be primed.", error)
    }
    return false
  }
}

function isErrorNamed(error: unknown, name: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === name
  )
}

function logBlockedAudioOnce(key: string) {
  if (isBlockedWarningShown) {
    return
  }

  isBlockedWarningShown = true
  logger.debug(
    `Store audio '${key}' was blocked by the browser until media playback is allowed.`
  )
}
