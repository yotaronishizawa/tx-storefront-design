import { createHash } from "node:crypto"
import { readdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

const SERVICE_WORKER = "sw.js"
const MANIFEST_PLACEHOLDER = "self.__PRECACHE_MANIFEST"

type PrecacheEntry = { url: string; revision: string }

/**
 * Writes every file of the client build, with a hash of its content, into
 * `sw.js`. A deploy that changes any file so changes `sw.js`, which is how the
 * browser notices the update. Runs on `buildEnd`, after `index.html` is
 * prerendered and the source maps are deleted.
 */
export async function injectPrecacheManifest(clientDirectory: string) {
  const files = await listFiles(clientDirectory)
  const manifest: PrecacheEntry[] = await Promise.all(
    files
      .filter((file) => file !== SERVICE_WORKER && !file.endsWith(".map"))
      .sort()
      .map(async (file) => ({
        url: file,
        revision: hashContent(await readFile(path.join(clientDirectory, file))),
      }))
  )

  const serviceWorkerPath = path.join(clientDirectory, SERVICE_WORKER)
  const serviceWorker = await readFile(serviceWorkerPath, "utf8")
  if (!serviceWorker.includes(MANIFEST_PLACEHOLDER)) {
    throw new Error(`${SERVICE_WORKER} has no ${MANIFEST_PLACEHOLDER} to fill`)
  }

  await writeFile(
    serviceWorkerPath,
    serviceWorker.replace(MANIFEST_PLACEHOLDER, JSON.stringify(manifest))
  )
}

/** Paths relative to `directory`, with `/` separators, as the worker requests them. */
async function listFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, {
    recursive: true,
    withFileTypes: true,
  })
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) =>
      path
        .relative(directory, path.join(entry.parentPath, entry.name))
        .split(path.sep)
        .join("/")
    )
}

function hashContent(content: Buffer): string {
  return createHash("sha256").update(content).digest("hex").slice(0, 16)
}
