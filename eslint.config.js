import { existsSync, readFileSync } from "node:fs"
import { dirname } from "node:path"
import { fileURLToPath } from "node:url"

import js from "@eslint/js"
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript"
import betterTailwind from "eslint-plugin-better-tailwindcss"
import importX from "eslint-plugin-import-x"
import reactHooks from "eslint-plugin-react-hooks"
import tseslint from "typescript-eslint"

const ROOT = dirname(fileURLToPath(import.meta.url))
const SOURCE = ["app/**/*.{ts,tsx}"]

/*
 * Import direction. Each list runs top to bottom: an entry may import the ones
 * after it, never the ones before. See "Layering" in AGENTS.md.
 */
const LAYERS = ["routes", "domains", "views", "components"]
const LEAVES = [
  "api",
  "config",
  "core",
  "hooks",
  "initializer",
  "model",
  "types",
  "utils",
]
const LEAF_ORDER = ["model", "api", "utils", "types"]
const DOMAIN_ORDER = [
  "reset-domain-stores.ts",
  "restocking",
  "shelf",
  "robot",
  "operations",
  "store-selection",
  "session",
  "app-shell",
]

/* Each hub under api/ builds on api/shared; neither knows the other. */
const API_HUBS = ["opm", "stock-shelf"]

const oneWay = (dirs, base, message) =>
  dirs.flatMap((target, index) =>
    dirs.slice(0, index).map((from) => ({
      target: `./app/${base}${target}`,
      from: `./app/${base}${from}`,
      message,
    }))
  )

const importZones = [
  ...oneWay(
    LAYERS,
    "",
    "Imports point one way: routes → domains → views → components → the rest."
  ),
  ...LEAVES.flatMap((leaf) =>
    LAYERS.map((layer) => ({
      target: `./app/${leaf}`,
      from: `./app/${layer}`,
      message: `${leaf}/ is a leaf and may not import ${layer}/.`,
    }))
  ),
  ...oneWay(
    LEAF_ORDER,
    "",
    "model uses api, utils and types; api uses utils and types; utils uses types; types uses none of them."
  ),
  ...oneWay(
    DOMAIN_ORDER,
    "domains/",
    `Domains import top to bottom: ${DOMAIN_ORDER.join(" → ")}.`
  ),
  ...API_HUBS.map((hub) => ({
    target: "./app/api/shared",
    from: `./app/api/${hub}`,
    message: "api/shared knows neither hub; it is what both build on.",
  })),
  ...API_HUBS.flatMap((target) =>
    API_HUBS.filter((from) => from !== target).map((from) => ({
      target: `./app/api/${target}`,
      from: `./app/api/${from}`,
      message:
        "One hub never imports the other. Code that needs both goes in model/.",
    }))
  ),
  {
    target: "./app/views",
    from: "./app/api",
    except: ["./opm/schemas"],
    message:
      "Routes fetch, views render. Load in the route and pass the data as props.",
  },
]

const restrictedImports = [
  {
    group: ["@base-ui/react", "@base-ui/react/**"],
    message: "Import the wrapper from ~/core.",
  },
  {
    group: ["~/core/**"],
    message: "Import from ~/core, not one of its files.",
  },
  {
    group: ["~/views/*/*/**"],
    message: "Import the view's index, not its internals.",
  },
  {
    // Generated contracts change shape on every regeneration; api/ re-exports the names the app needs.
    group: ["**/__generated__", "**/__generated__/**"],
    message:
      "Import generated contract names from ~/api/opm/schemas or ~/api/stock-shelf.",
  },
]

/* `@layer components` classes in app.css are not utilities; allow them by name. */
const componentClasses = existsSync("app/app.css")
  ? [
      ...readFileSync("app/app.css", "utf8").matchAll(
        /^\s*\.([a-z][a-z0-9-]*)/gm
      ),
    ].map((match) => `^${match[1]}$`)
  : []

export default [
  {
    ignores: [
      ".react-router/**",
      "build/**",
      "coverage/**",
      "dist/**",
      // Generated from txoperationmanager and tx-stock-shelf by `pnpm generate:types`.
      "**/__generated__/**",
      "test-results/**",
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  reactHooks.configs.flat["recommended-latest"],

  {
    files: SOURCE,
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: ROOT },
    },
    plugins: { "import-x": importX, "better-tailwindcss": betterTailwind },
    settings: {
      "import-x/resolver-next": [
        createTypeScriptImportResolver({ project: "./tsconfig.json" }),
      ],
      "better-tailwindcss": { entryPoint: "app/app.css" },
    },
    rules: {
      eqeqeq: ["error", "always", { null: "ignore" }],
      "no-console": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          ignoreRestSiblings: true,
          varsIgnorePattern: "^_",
        },
      ],

      "import-x/no-restricted-paths": [
        "error",
        { basePath: ROOT, zones: importZones },
      ],
      "no-restricted-imports": ["error", { patterns: restrictedImports }],
      "no-restricted-syntax": [
        "error",
        ...["button", "input", "select"].map((tag) => ({
          selector: `JSXOpeningElement[name.name="${tag}"]`,
          message: `Use the ~/core control instead of a raw <${tag}>.`,
        })),
      ],

      ...betterTailwind.configs["correctness-error"].rules,
      "better-tailwindcss/enforce-canonical-classes": "error",
      "better-tailwindcss/enforce-shorthand-classes": "error",
      "better-tailwindcss/no-unknown-classes": [
        "error",
        { ignore: componentClasses },
      ],

      // Adjustments to the recommended sets, each for a reason in this codebase:
      // `declare namespace X { type Props }` is how Base UI, and so app/core, types props.
      "@typescript-eslint/no-namespace": ["error", { allowDeclarations: true }],
      // `interface X extends Y {}` is how a global type is augmented.
      "@typescript-eslint/no-empty-object-type": [
        "error",
        { allowInterfaces: "with-single-extends" },
      ],
      // A few variables are captured by a closure before their one assignment.
      "prefer-const": ["error", { ignoreReadBeforeAssign: true }],
      // `onClick={async () => …}` wires every OPM command; the runner swallows rejections.
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
      // Readers still start from `asRecord()`; the fix is dropping it, not casting around it.
      "@typescript-eslint/no-base-to-string": "off",
      // About fifteen screens derive state in an effect; each is its own refactor.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    // The UI kit is where Base UI and the raw controls are wrapped.
    files: ["app/core/**"],
    rules: { "no-restricted-imports": "off", "no-restricted-syntax": "off" },
  },
  {
    // api/ wraps the generated contracts, so it alone reads them directly.
    files: ["app/api/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: restrictedImports.filter(
            ({ group }) => !group.includes("**/__generated__/**")
          ),
        },
      ],
    },
  },
  {
    // The one sanctioned console access.
    files: ["app/config/logger.ts"],
    rules: { "no-console": "off" },
  },
]
