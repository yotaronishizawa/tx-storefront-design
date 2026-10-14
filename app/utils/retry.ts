import { delay } from "./poll"

type Settled<T> = { ok: true; value: T } | { ok: false; error: unknown }

type RetryOptions<T> = {
  retries: number
  initialDelayMs: number
  maxDelayMs: number
  /** `true` spends one more retry. */
  shouldRetry: (outcome: Settled<T>) => boolean
  /** Called before each wait with the retry number (from 1) and the delay. */
  onRetry?: (retry: number, delayMs: number) => void
}

const JITTER = 0.2

/**
 * Runs `task` up to `retries + 1` times while `shouldRetry` says so, doubling
 * the delay from `initialDelayMs` up to `maxDelayMs`, ±20% jitter. Resolves to
 * the last value or rethrows the last error.
 */
export async function retryWithBackoff<T>(
  task: () => Promise<T>,
  { retries, initialDelayMs, maxDelayMs, shouldRetry, onRetry }: RetryOptions<T>
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const outcome = await settle(task)
    if (attempt >= retries || !shouldRetry(outcome)) {
      if (outcome.ok) {
        return outcome.value
      }
      throw outcome.error
    }

    const base = Math.min(initialDelayMs * 2 ** attempt, maxDelayMs)
    const jittered = base * (1 + (Math.random() * 2 - 1) * JITTER)
    const wait = Math.min(jittered, maxDelayMs)
    onRetry?.(attempt + 1, wait)
    await delay(wait)
  }
}

async function settle<T>(task: () => Promise<T>): Promise<Settled<T>> {
  try {
    return { ok: true, value: await task() }
  } catch (error) {
    return { ok: false, error }
  }
}
