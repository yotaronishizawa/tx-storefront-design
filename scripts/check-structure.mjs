import { existsSync } from "node:fs"
import { readdir, readFile } from "node:fs/promises"
import path from "node:path"

const APP_ROOT = path.join(process.cwd(), "app")
const MAX_CODE_LINES = 600
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"])
const CHECK_EXTENSIONS = new Set([".ts", ".tsx", ".json"])
const EXCLUDED_DIRS = new Set([
  ".git",
  ".react-router",
  "build",
  "coverage",
  "dist",
  "node_modules",
])
const APP_CATEGORIES = new Set([
  "api",
  "components",
  "config",
  "core",
  "domains",
  "hooks",
  "initializer",
  "layouts",
  "model",
  "routes",
  "types",
  "utils",
  "views",
])
const ROUTE_SUPPORT_FOLDERS = new Set([
  "components",
  "config",
  "core",
  "hooks",
  "locales",
  "schema",
  "utils",
])

const violations = []

const report = (rule, message) => {
  violations.push({ rule, message })
}

const posixRelative = (filePath) =>
  path.relative(process.cwd(), filePath).split(path.sep).join("/")

const walk = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    if (EXCLUDED_DIRS.has(entry.name)) continue

    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)))
      continue
    }

    if (entry.isFile() && CHECK_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath)
    }
  }

  return files
}

const stripLineComment = (line) => {
  const index = line.indexOf("//")
  return index === -1 ? line : line.slice(0, index)
}

const countCodeLines = (text) => {
  let inBlockComment = false
  let count = 0

  for (const rawLine of text.split(/\r?\n/)) {
    let line = rawLine
    let code = ""

    while (line.length > 0) {
      if (inBlockComment) {
        const end = line.indexOf("*/")
        if (end === -1) {
          line = ""
          break
        }
        line = line.slice(end + 2)
        inBlockComment = false
        continue
      }

      const start = line.indexOf("/*")
      if (start === -1) {
        code += stripLineComment(line)
        line = ""
        break
      }

      code += stripLineComment(line.slice(0, start))
      const end = line.indexOf("*/", start + 2)
      if (end === -1) {
        inBlockComment = true
        line = ""
        break
      }
      line = line.slice(end + 2)
    }

    if (code.trim().length > 0) count += 1
  }

  return count
}

const isDts = (filePath) => filePath.endsWith(".d.ts")

const isDeclarativeCode = (filePath) => {
  const segments = posixRelative(filePath).split("/")
  return segments.some((segment) =>
    ["config", "_config", "locales", "_locales"].includes(segment)
  )
}

// Generated (`pnpm generate:types`): its size is OPM's contract, not a module to split.
const isGeneratedCode = (filePath) =>
  posixRelative(filePath).split("/").includes("__generated__")

const checkFileSize = async (filePath) => {
  if (!SOURCE_EXTENSIONS.has(path.extname(filePath)) || isDts(filePath)) return
  if (isDeclarativeCode(filePath) || isGeneratedCode(filePath)) return

  const text = await readFile(filePath, "utf8")
  const lines = countCodeLines(text)

  if (lines > MAX_CODE_LINES) {
    report(
      "module-size",
      `${posixRelative(filePath)} has ${lines} code lines; split it or move declarative data out before exceeding ${MAX_CODE_LINES}.`
    )
  }
}

const checkFileName = (filePath) => {
  const relative = posixRelative(filePath)
  const extension = path.extname(filePath)
  if (!CHECK_EXTENSIONS.has(extension)) return

  const base = path.basename(filePath, extension)
  if (isDts(filePath)) return

  if (/[A-Z_]/.test(base)) {
    report(
      "file-naming",
      `${relative} should use kebab-case filename segments.`
    )
  }
}

const checkRouteSupportFolders = async (dir) => {
  if (!existsSync(dir)) return

  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isDirectory() || EXCLUDED_DIRS.has(entry.name)) continue

    const fullPath = path.join(dir, entry.name)
    const relative = posixRelative(fullPath)

    if (
      relative.startsWith("app/routes/") &&
      ROUTE_SUPPORT_FOLDERS.has(entry.name)
    ) {
      report(
        "route-support-folders",
        `${relative}/ is non-routable route support code; rename it with an underscore prefix.`
      )
    }

    await checkRouteSupportFolders(fullPath)
  }
}

const IMPORT_PATTERNS = [
  /\b(?:import|export)\b(?:\s+type)?[\s\S]*?\bfrom\s*["']([^"']+)["']/g,
  /\bimport\s*["']([^"']+)["']/g,
  /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
]

const importSpecifiers = (text) =>
  IMPORT_PATTERNS.flatMap((pattern) =>
    [...text.matchAll(pattern)].map((match) => ({
      line: lineNumberAt(text, match.index),
      specifier: match[1],
    }))
  )

const lineNumberAt = (text, index) => text.slice(0, index).split(/\r?\n/).length

const checkImports = async (filePath) => {
  if (!SOURCE_EXTENSIONS.has(path.extname(filePath)) || isDts(filePath)) return

  const relative = posixRelative(filePath)
  const [, category] = relative.split("/")
  const text = await readFile(filePath, "utf8")

  for (const { line, specifier } of importSpecifiers(text)) {
    if (/^(\.\.\/){3,}/.test(specifier)) {
      report(
        "deep-relative-import",
        `${relative}:${line} uses ${specifier}; cross app categories through the root alias instead of climbing past ../../.`
      )
    }

    if (
      !["domains", "model", "views"].includes(category) &&
      APP_CATEGORIES.has(category) &&
      specifier.startsWith(`~/${category}/`)
    ) {
      report(
        "same-category-alias",
        `${relative}:${line} imports ${specifier}; stay relative inside app/${category}/ and reserve ~/ for category crossings.`
      )
    }
  }
}

const flattenKeys = (value, prefix = "") => {
  if (Array.isArray(value)) return [prefix.slice(0, -1)]
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) =>
      flattenKeys(child, `${prefix}${key}.`)
    )
  }
  return [prefix.slice(0, -1)]
}

const localeGroupKey = (filePath) => posixRelative(path.dirname(filePath))

const checkLocaleParity = async (files) => {
  const groups = new Map()

  for (const filePath of files) {
    const segments = posixRelative(filePath).split("/")
    // Grouped by containing directory, so each namespace is compared with its own `en.json`.
    if (!segments.includes("locales") && !segments.includes("_locales"))
      continue

    const group = localeGroupKey(filePath)
    groups.set(group, [...(groups.get(group) ?? []), filePath])
  }

  for (const [group, localeFiles] of groups) {
    if (localeFiles.length < 2) continue

    const bundles = await Promise.all(
      localeFiles.sort().map(async (filePath) => {
        const json = JSON.parse(await readFile(filePath, "utf8"))
        return {
          filePath,
          keys: new Set(flattenKeys(json).sort()),
        }
      })
    )
    const reference =
      bundles.find((bundle) =>
        path.basename(bundle.filePath).startsWith("en.")
      ) ?? bundles[0]

    for (const bundle of bundles) {
      if (bundle === reference) continue

      const missing = [...reference.keys].filter((key) => !bundle.keys.has(key))
      const extra = [...bundle.keys].filter((key) => !reference.keys.has(key))

      if (missing.length > 0 || extra.length > 0) {
        const details = [
          ["missing", missing],
          ["extra", extra],
        ]
          .filter(([, keys]) => keys.length > 0)
          .map(([label, keys]) => `${label} ${keys.slice(0, 5).join(", ")}`)
          .join("; ")

        report(
          "locale-parity",
          `${posixRelative(bundle.filePath)} does not match ${posixRelative(reference.filePath)} in ${group}: ${details}.`
        )
      }
    }
  }
}

const flattenEntries = (value, prefix = "") => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.entries(value).flatMap(([key, child]) =>
      flattenEntries(child, `${prefix}${key}.`)
    )
  }
  return [[prefix.slice(0, -1), value]]
}

/**
 * A malformed ICU message throws at render, in front of an operator. Keep
 * plurals inside one ICU string: `key_one`/`key_other` suffixes would break
 * locale parity, since ja and zh have fewer plural forms.
 */
const checkIcuMessages = async (files) => {
  let IntlMessageFormat
  try {
    ;({ IntlMessageFormat } = await import("intl-messageformat"))
  } catch {
    return
  }

  for (const filePath of files) {
    const segments = posixRelative(filePath).split("/")
    if (!segments.includes("locales") && !segments.includes("_locales"))
      continue
    if (path.extname(filePath) !== ".json") continue

    const language = path.basename(filePath, ".json")
    const bundle = JSON.parse(await readFile(filePath, "utf8"))

    for (const [key, value] of flattenEntries(bundle)) {
      if (typeof value !== "string") continue
      try {
        new IntlMessageFormat(value, language)
      } catch (error) {
        report(
          "icu-message",
          `${posixRelative(filePath)} key ${key} is not a valid ICU message: ${error.message}`
        )
      }
    }
  }
}

/** Every domain store's reset must be called from `resetDomainStores()`, or sign-out leaks state into the next shift. */
const checkDomainStoreResets = async (files) => {
  const aggregatorPath = path.join(
    APP_ROOT,
    "domains",
    "reset-domain-stores.ts"
  )
  if (!existsSync(aggregatorPath)) return

  const aggregator = await readFile(aggregatorPath, "utf8")

  for (const filePath of files) {
    const relative = posixRelative(filePath)
    if (!relative.startsWith("app/domains/")) continue
    if (!relative.endsWith("-store.ts")) continue

    const source = await readFile(filePath, "utf8")
    for (const match of source.matchAll(
      /export function (reset[A-Za-z0-9_]*Store)\s*\(/g
    )) {
      const resetName = match[1]
      if (!new RegExp(`\\b${resetName}\\s*\\(\\s*\\)`).test(aggregator)) {
        report(
          "domain-store-reset",
          `${relative} exports ${resetName}() but app/domains/reset-domain-stores.ts never calls it. Sign-out would leave this domain holding the previous operator's state.`
        )
      }
    }
  }
}

/**
 * Every domain sorts its files by job, so the folder says what a file does.
 *
 * Root: `index.ts`, `<domain>-store.ts`, `use-<domain>.ts` (reactive reads).
 * `actions/` returns operator-triggered functions, `effects/` is mount-once
 * hooks, `services/` and `storage/` are plain functions with no React.
 */
const DOMAIN_FOLDERS = new Set(["actions", "effects", "services", "storage"])
const HOOK_FOLDERS = new Set(["actions", "effects"])

const checkDomainLayout = async (files) => {
  for (const filePath of files) {
    const relative = posixRelative(filePath)
    if (!relative.startsWith("app/domains/")) continue

    const [, , domain, ...rest] = relative.split("/")
    if (rest.length === 0) continue // a file beside the domains, like reset-domain-stores.ts

    if (rest.length === 1) {
      const allowed = ["index.ts", `${domain}-store.ts`, `use-${domain}.ts`]
      if (!allowed.includes(rest[0])) {
        report(
          "domain-layout",
          `${relative} sits at the root of ${domain}/, which holds only ${allowed.join(", ")}. Move it into actions/, effects/, services/ or storage/.`
        )
      }
      continue
    }

    const [folder, fileName] = rest
    if (rest.length > 2 || !DOMAIN_FOLDERS.has(folder)) {
      report(
        "domain-layout",
        `${relative} is not in one of ${domain}/'s folders: ${[...DOMAIN_FOLDERS].join(", ")}.`
      )
      continue
    }

    if (HOOK_FOLDERS.has(folder) && !fileName.startsWith("use-")) {
      report(
        "domain-layout",
        `${relative} is in ${folder}/, which holds hooks only; a plain function goes in services/.`
      )
      continue
    }

    if (!HOOK_FOLDERS.has(folder)) {
      const source = await readFile(filePath, "utf8")
      if (/from "react(-router)?"/.test(source)) {
        report(
          "domain-layout",
          `${relative} imports React, but ${folder}/ holds plain functions; a hook goes in actions/ or effects/.`
        )
      }
    }
  }
}

/**
 * A view folder is one screen: `views/<area>/<name>/` with `index.ts`
 * re-exporting the one component a route renders, which sits beside it.
 * `<name>-dialog/` exports `<Name>Dialog` from `<name>-dialog.tsx`; any other
 * `<name>/` exports `<Name>View` from `<name>-view.tsx`. What that component
 * is built from goes in components/, hooks/ or utils/, and one view never
 * imports another: a piece two views share belongs in app/components/.
 */
const VIEW_FOLDERS = new Set(["components", "hooks", "utils"])

const pascalCase = (kebab) =>
  kebab
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("")

const viewEntry = (name) =>
  name.endsWith("-dialog")
    ? { file: name, component: pascalCase(name) }
    : { file: `${name}-view`, component: `${pascalCase(name)}View` }

const checkViewLayout = async (files) => {
  const viewFolders = new Map()

  for (const filePath of files) {
    const relative = posixRelative(filePath)
    if (!relative.startsWith("app/views/")) continue

    const [, , area, name, ...rest] = relative.split("/")
    if (!name || rest.length === 0) {
      report(
        "view-layout",
        `${relative} is not inside a view folder; views live at app/views/<area>/<name>/.`
      )
      continue
    }

    const folder = `app/views/${area}/${name}`
    viewFolders.set(folder, name)
    const { file } = viewEntry(name)

    if (rest.length === 1) {
      const allowed = ["index.ts", `${file}.tsx`]
      if (!allowed.includes(rest[0])) {
        report(
          "view-layout",
          `${relative} sits at the root of ${name}/, which holds only ${allowed.join(" and ")}. Move it into components/, hooks/ or utils/.`
        )
      }
    } else if (!VIEW_FOLDERS.has(rest[0])) {
      report(
        "view-layout",
        `${relative} is not in one of ${name}/'s folders: ${[...VIEW_FOLDERS].join(", ")}.`
      )
    }

    const source = await readFile(filePath, "utf8")
    if (/from "~\/views\//.test(source)) {
      report(
        "view-layout",
        `${relative} imports another view. A piece two views share goes in app/components/.`
      )
    }
  }

  for (const [folder, name] of viewFolders) {
    const { file, component } = viewEntry(name)
    const expected = `export { ${component} } from "./${file}"`
    const indexPath = path.join(process.cwd(), folder, "index.ts")
    const index = existsSync(indexPath)
      ? (await readFile(indexPath, "utf8")).trim()
      : null

    if (index !== expected) {
      report("view-layout", `${folder}/index.ts must be exactly: ${expected}`)
    }
  }
}

const main = async () => {
  if (!existsSync(APP_ROOT)) {
    throw new Error("Expected an app/ source root.")
  }

  const files = await walk(APP_ROOT)

  await checkRouteSupportFolders(path.join(APP_ROOT, "routes"))
  await Promise.all(
    files.map(async (filePath) => {
      checkFileName(filePath)
      await checkFileSize(filePath)
      await checkImports(filePath)
    })
  )
  await checkLocaleParity(files)
  await checkIcuMessages(files)
  await checkDomainStoreResets(files)
  await checkDomainLayout(files)
  await checkViewLayout(files)

  if (violations.length > 0) {
    const grouped = Map.groupBy(violations, (violation) => violation.rule)

    console.error("Structure check failed:")
    for (const [rule, items] of grouped) {
      console.error(`\n${rule}`)
      for (const item of items) console.error(`- ${item.message}`)
    }
    process.exitCode = 1
    return
  }

  console.log(`Structure check passed. Checked ${files.length} app files.`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
