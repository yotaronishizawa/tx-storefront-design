// `localStorage` that never throws: private mode, blocked site data or a full quota.

export function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

/** The stored JSON, or `null` when it is missing or does not parse. */
export function readStorageJson(key: string): unknown {
  const raw = readStorage(key)
  if (!raw) {
    return null
  }
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

export function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Ignored, see above.
  }
}

export function removeStorage(key: string): void {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Ignored, see above.
  }
}
