# AGENTS.md

A design mock of TX Storefront, the operator console for a robotic convenience-store
shelf, used on an iPad. It is a snapshot of the `tx-storefront` app for testing UI and
behaviour: **there is no backend**. Both SignalR hubs are faked inside the page by
`simulator/` (see [`simulator/README.md`](simulator/README.md)); `.env.mock` points the
app at `sim.invalid`, which never reaches the network. The person using this is a
designer: keep explanations plain and changes small.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Dev server; the control panel is at `/sim-controls/index.html` |
| `pnpm build` | Static build in `build/client` |
| `pnpm ship` | Build and publish to Firebase Hosting with `firebase-key.json` |
| `pnpm check` | Structure check, ESLint, typecheck |

## Rules that matter here

- Never connect to a real OPM, store or robot, and never commit `firebase-key.json`.
- Change screens in `app/views/` and shared UI in `app/components/`; state lives in
  `app/domains/`. Views render from props only.
- Import UI from `~/core` (the only place `@base-ui/react` is used). Style with the
  tokens in `app/app.css` — read [`docs/design-tokens.md`](docs/design-tokens.md)
  first; no raw palette, hex or arbitrary colours.
- Text goes through `useTranslation()`; add every key to all of
  `app/locales/app/{ja,en,zh,ne,bn}.json`. Japanese is the default.
- `__generated__/` folders are generated; never edit them.
- New demo behaviour (a scenario, a fake OPM answer) goes in `simulator/src/`, not
  in the app.
- Reloading the app tab resets the simulator to its seed.
