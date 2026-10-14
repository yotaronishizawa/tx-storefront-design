import {
  authSessionSchema,
  type AuthSession,
  type Credentials,
} from "~/api/opm/schemas"
import {
  readStorage,
  readStorageJson,
  removeStorage,
  writeStorage,
} from "~/utils/local-storage"

const SESSION_KEY = "tx-storefront:opm-session"
const CREDENTIALS_KEY = "tx-storefront:opm-credentials"
const STORE_KEY = "tx-storefront:selected-store"

export function readStoredSession(): AuthSession | null {
  const parsed = authSessionSchema.safeParse(readStorageJson(SESSION_KEY))
  return parsed.success ? parsed.data : null
}

export function storeSession(session: AuthSession): void {
  writeStorage(SESSION_KEY, JSON.stringify(session))
}

export function clearStoredSession(): void {
  removeStorage(SESSION_KEY)
  removeStorage(CREDENTIALS_KEY)
  removeStorage(STORE_KEY)
}

export function readStoredCredentials(): Credentials | null {
  const parsed = readStorageJson(CREDENTIALS_KEY)
  return isStoredCredentials(parsed) ? parsed : null
}

/** Reauth needs both halves; a half-written record is no better than none. */
function isStoredCredentials(value: unknown): value is Credentials {
  if (!value || typeof value !== "object") {
    return false
  }

  const { agentId, password } = value as {
    agentId?: unknown
    password?: unknown
  }
  return typeof agentId === "string" && typeof password === "string"
}

export function storeCredentials(credentials: Credentials): void {
  writeStorage(CREDENTIALS_KEY, JSON.stringify(credentials))
}

export function readStoredStoreId(): string {
  return readStorage(STORE_KEY) ?? ""
}

export function storeSelectedStoreId(storeId: string): void {
  if (!storeId) {
    removeStorage(STORE_KEY)
    return
  }

  writeStorage(STORE_KEY, storeId)
}
