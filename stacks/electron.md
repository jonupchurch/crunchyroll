# Stack pack — Electron + React + SQLite (npm-delivered)

Defaults for an Electron desktop shell delivered over npm. **The repo's own
patterns win** wherever they differ (constitution Principle III).

Written against a project whose constitution carried a Part II of
product-specific gates, and the Roman numerals below are citations into it:
**XI** credentials live in the OS keychain and nowhere else, **XII** adapters
stay thin and the service layer holds the logic, **XVII** Windows is
first-class, **XVIII** the engine runs with Electron uninstalled. A host
project that has no such Part II should read those citations as the rules
just stated — they are good defaults for this stack either way, and the
numbering is only there so a project that *does* define them can trace back.

## Defaults

**Three processes, one direction of trust.** *Main* is Node with full
privilege: it owns the service layer, SQLite, the keychain, and every outbound
provider call. *Preload* is a narrow bridge. *Renderer* is React and is treated
as **untrusted** — it renders provider-supplied strings (ticket titles, PR
bodies, branch names) and must never hold anything worth stealing.

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`,
  `webSecurity: true`. These are not negotiable per-window settings.
- Preload exposes a **hand-enumerated** API via `contextBridge.exposeInMainWorld`
  — one method per capability. Never expose a generic
  `invoke(channel, ...args)` passthrough; that hands the renderer the entire
  IPC surface back and defeats the isolation you just configured.
- Renderer content loads from **local files only**. No remote URLs, no CDN
  scripts, no `webview`. Ship a CSP.

**IPC.** `ipcMain.handle` / `ipcRenderer.invoke` for request-response;
`webContents.send` / `ipcRenderer.on` for push (freshness ticks, sync
progress). Namespace channels `<app>:<domain>:<verb>`. **Validate every
payload inside the handler** (Principle II) — the renderer is a trust
boundary, not a friend. Return typed errors rather than throwing raw provider
errors across the bridge.

**React renderer.** Function components, hooks, TS strict. Put a query cache
(TanStack Query) over IPC-backed fetchers: polling, staleness, and manual
refresh map onto it directly, and it surfaces `dataUpdatedAt`, which is what
Principle XIV needs to render. Give each lane its own error boundary and its
own query so one failing provider can't blank the others (Principle XV). The
renderer never opens SQLite, never sees a token, never calls a provider API.

**Service layer placement.** The core service must be importable and testable
with no Electron present (Principle XVIII) — so it lives in its own module
that `import`s nothing from `electron`. Whether it *runs* in the main process
or in a `utilityProcess.fork` child is a per-project decision: the utility
process keeps long synchronous SQLite and heavy computation off the window's
event loop, at the cost of another hop and a serialisation boundary. Write
core code so either works, and record which one you chose and why.

**SQLite.** `better-sqlite3` is synchronous and fast, but it blocks whatever
event loop it runs on — keep per-call work short, or move it off main.
It is a **native module**, so it must be rebuilt against Electron's ABI
(`@electron/rebuild`), not Node's. WAL mode on; migrations versioned and
forward-only; mirrored and authored data in **separate databases**, not just
separate tables (Principle XIII) — that makes "delete the mirror and rebuild"
a file deletion rather than a careful cascade.

**Credentials.** Prefer a true OS keychain binding — `@napi-rs/keyring`
(macOS Keychain, Windows Credential Manager, Linux libsecret; maintained, with
prebuilt binaries). Electron's built-in `safeStorage` is the fallback, but note
it encrypts a blob *you* then have to store somewhere, which sits awkwardly
against XI's "never in a dotfile, never in SQLite." `keytar` is archived — do
not adopt it. Keep this behind an auth-provider seam so OAuth can land later
without touching call sites.

**Opening links.** `shell.openExternal` only after validating the URL parses
and its scheme is `https:`. Provider data supplies these URLs, so treat them as
hostile: never pass one through unchecked, and never allow `file:`,
`javascript:`, or a custom scheme.

**npx delivery.** The published npm package is a thin launcher — a `bin/`
entry that resolves the Electron runtime, downloads it from GitHub releases on
first run, verifies a checksum, caches it per machine under a versioned path,
then spawns the app. (Pattern: `github.com/jonupchurch/CoCoPilot`.) The native
module must match that runtime's ABI, so prebuilds are published per
platform/arch and selected at install or first run. **This is the riskiest
packaging path in the project** — a mismatched `better-sqlite3` ABI fails at
require time on a user's machine, not in CI.

## Where things go

- `src/main/` — app lifecycle, windows, IPC handlers, keychain access.
- `src/preload/` — the contextBridge surface and nothing else.
- `src/renderer/` — the React app; no Node imports, ever.
- `src/shared/` — types and channel-name constants imported by both sides.
  **Types only** — nothing with a runtime Node dependency.
- The core service, providers, and correlation engine live outside all four,
  in a module with no `electron` import.

Workspace/monorepo layout is a `speckit-plan` decision, not a stack default.

## Don't

- Don't set `nodeIntegration: true` or `contextIsolation: false` — not "just
  for dev," since dev is where the habit forms.
- Don't expose a generic channel passthrough over `contextBridge`.
- Don't give the renderer fs access, a SQLite handle, or a provider token.
- Don't `shell.openExternal` a URL you haven't scheme-checked.
- Don't `import { app } from 'electron'` anywhere the correlation engine can
  reach — it makes the engine untestable and violates XVIII.
- Don't block main's event loop with a long synchronous query or a full
  correlation pass.
- Don't hardcode path separators or assume case-sensitive paths (XVII).
- Don't store a credential anywhere but the keychain (XI).

## Verify (before "done")

- Typecheck and build pass; the app launches **on Windows first** (XVII).
- `npx <your-cli>` from a machine with a cleared runtime cache: the runtime
  downloads, `better-sqlite3` loads, the app opens.
- Context isolation is real — `window.require` and `process` are `undefined`
  in the renderer console.
- Grep the app-data directory, logs, and both databases for a known token
  value: zero hits (XI).
- Delete the mirror database and relaunch: the app rebuilds it and every note
  and mapping survives (XIII).
- Core and correlation tests run green with Electron uninstalled (XVIII).
