import type { Resource, ResourceKey } from "i18next"

/**
 * `app/locales/<namespace>/<language>.json`, so a new namespace is just a new
 * folder. Loaded eagerly: the corpus is small, and `t()` then returns real
 * strings on the first render.
 */
const modules = import.meta.glob<{ default: ResourceKey }>(
  "../locales/*/*.json",
  { eager: true }
)

const LOCALE_PATH = /\/locales\/([^/]+)\/([^/]+)\.json$/

export const RESOURCES: Resource = {}

const namespaces = new Set<string>()

for (const [path, module] of Object.entries(modules)) {
  const match = LOCALE_PATH.exec(path)
  if (!match) continue

  const [, namespace, language] = match
  namespaces.add(namespace)
  RESOURCES[language] = { ...RESOURCES[language], [namespace]: module.default }
}

const DEFAULT_NAMESPACE = "common"

const otherNamespaces = Array.from(namespaces)
  .filter((namespace) => namespace !== DEFAULT_NAMESPACE)
  .sort()

/** `common` first: i18next resolves an unprefixed key against this list in order. */
export const NAMESPACES = [DEFAULT_NAMESPACE, ...otherNamespaces]
