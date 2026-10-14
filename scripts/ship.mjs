/*
 * `pnpm ship`: builds this folder as it is on disk and publishes it to
 * Firebase Hosting. The only setup is the deploy key: put the JSON file you
 * were given at `firebase-key.json` in this folder (or point
 * GOOGLE_APPLICATION_CREDENTIALS at it). The key names its own project.
 */
import { spawnSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = fileURLToPath(new URL("..", import.meta.url))
const FIREBASE_TOOLS = "firebase-tools@15.33.0"

function fail(message) {
  console.error(`\n✖ ${message}\n`)
  process.exit(1)
}

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    env,
    stdio: "inherit",
    shell: process.platform === "win32",
  })
  if (result.status !== 0) {
    fail(`${command} ${args.join(" ")} failed.`)
  }
}

function git(...args) {
  const result = spawnSync("git", args, { cwd: ROOT, encoding: "utf8" })
  return result.status === 0 ? result.stdout.trim() : ""
}

const keyPath = resolve(
  ROOT,
  process.env.GOOGLE_APPLICATION_CREDENTIALS || "firebase-key.json"
)
if (!existsSync(keyPath)) {
  fail(
    `No deploy key at ${keyPath}.\n  Put the firebase-key.json you were given in this folder, then run pnpm ship again.`
  )
}

let projectId
try {
  projectId = JSON.parse(readFileSync(keyPath, "utf8")).project_id
} catch {
  fail(`${keyPath} is not a Firebase service account key (JSON).`)
}
if (!projectId) {
  fail(`${keyPath} has no project_id.`)
}

const stamp = new Date().toISOString().slice(0, 16).replace("T", " ")
const commit = git("rev-parse", "--short", "HEAD")
const dirty = git("status", "--porcelain") ? "+edits" : ""
const version = [`mock ${stamp}`, commit && `${commit}${dirty}`]
  .filter(Boolean)
  .join(" · ")

console.log(`\n→ Building ${version}\n`)
run("pnpm", ["run", "build"], { ...process.env, VITE_APP_VERSION: version })

console.log(`\n→ Publishing to Firebase project ${projectId}\n`)
run(
  "pnpm",
  [
    "dlx",
    FIREBASE_TOOLS,
    "deploy",
    "--only",
    "hosting",
    "--project",
    projectId,
    "--non-interactive",
    "--message",
    version,
  ],
  { ...process.env, GOOGLE_APPLICATION_CREDENTIALS: keyPath }
)

console.log(
  `\n✔ Live at https://${projectId}.web.app  (control panel: /sim-controls/index.html)\n`
)
