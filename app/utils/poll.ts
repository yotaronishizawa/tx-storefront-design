export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms))
}

/**
 * Runs `check` up to `retries + 1` times, `intervalMs` apart, until it returns true.
 *
 * @example await pollUntil(async () => isReady(), { retries: 3, intervalMs: 1000 }) // true once ready, false after ~3s
 */
export async function pollUntil(
  check: () => Promise<boolean>,
  { retries, intervalMs }: { retries: number; intervalMs: number }
): Promise<boolean> {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    if (await check()) {
      return true
    }
    if (attempt < retries) {
      await delay(intervalMs)
    }
  }
  return false
}
