import { useEffect, useState } from "react"

// The Battery Status API is Chromium-only, so it is missing from the DOM types.
type BatteryManager = EventTarget & { level: number }
type NavigatorWithBattery = Navigator & {
  getBattery?: () => Promise<BatteryManager>
}

/** The device battery as a whole percentage; `null` where the browser does not report it. */
export function useBatteryLevel() {
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null)

  useEffect(() => {
    let battery: BatteryManager | null = null

    function updateBattery() {
      if (battery) {
        setBatteryLevel(Math.round(battery.level * 100))
      }
    }

    void (window.navigator as NavigatorWithBattery)
      .getBattery?.()
      .then((nextBattery) => {
        battery = nextBattery
        updateBattery()
        battery.addEventListener("levelchange", updateBattery)
      })
      .catch(() => undefined)

    return () => battery?.removeEventListener("levelchange", updateBattery)
  }, [])

  return batteryLevel
}
