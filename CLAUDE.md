# JIMI App — React Native (Expo)

Pointers for future Claude sessions on this repo. The code is the source
of truth — this file is just orientation.

## What this is

The JIMI client app: a chatbot-driven calendar assistant that runs on
iOS, Android and Web from a single React Native codebase. The Spring
Boot backend lives in the sibling `jimi_api/` directory.

The Flutter origin (Dart, `lib/`, `pubspec.yaml`, etc.) was deleted on
2026-04-28. Don't reintroduce Dart sources or Flutter-specific tooling.

## Stack

- **React Native 0.74** + **Expo SDK 51**
- **expo-router** — file-based routing under `app/`
- **react-native-web** for the browser target
- **TypeScript strict**
- **AsyncStorage** for the persisted `userId` (so events stay tied to
  the same user across reloads)

## Project layout

Standard Expo layout — everything lives at the project root, no nested
app folder:

```
jimi_app/
├── app/                        # Expo Router routes (file-based)
│   ├── _layout.tsx             # Stack root + ApiHealthProvider + theme
│   ├── index.tsx               # → redirect to /home
│   ├── home.tsx                # Chat screen
│   ├── schedule.tsx            # Read-only event list (GET /agenda)
│   ├── about.tsx               # About
│   └── error.tsx               # Error page
├── api/
│   ├── constants.ts            # baseUrl resolution (env var → fallback)
│   ├── apiServicePost.ts       # POST /chat client
│   ├── agendaService.ts        # GET /agenda client (no LLM)
│   └── healthcheck.ts          # /chat probe used at startup
├── components/
│   ├── AppBar.tsx              # logo + status pill + calendar/info buttons
│   ├── ChatBubble.tsx          # one message bubble (uses RichText for bot)
│   ├── RichText.tsx            # markdown-lite renderer (**bold**, bullets…)
│   ├── EmptyChat.tsx           # initial state w/ suggestions
│   ├── TypingIndicator.tsx     # 3-dot animation while waiting for /chat
│   └── OfflineBanner.tsx       # red banner shown when API is offline
├── contexts/
│   └── ApiHealthContext.tsx    # online/offline state + retry
├── hooks/
│   └── useUserId.ts            # AsyncStorage-backed persistent userId
├── models/
│   └── Message.ts              # MessageModel + ChatApiResponse parser
├── theme/
│   └── styles.ts               # colors, typography, spacing, shadow
├── assets/images/logo.png
├── app.json                    # Expo config (iOS/Android/Web)
├── package.json
├── babel.config.js
├── metro.config.js             # scopes Metro to the project root
├── tsconfig.json
├── Dockerfile                  # static web build → nginx
├── docker/nginx.conf           # inner nginx serving the bundle
├── docker-compose.yml          # outer stack (app + api + nginx + certbot)
└── infra/                      # outer-nginx vhosts + Let's Encrypt bootstrap
```

## API contract

Backend is Spring Boot; the contract is documented in `jimi_api/CLAUDE.md`.

`POST /chat` — natural-language turn (LLM):
```json
{ "userId": "u1", "message": "...", "conversationId": null }
```
returns
```json
{
  "conversationId": "<uuid|null>",
  "status": "AWAITING_INFO" | "COMPLETED",
  "message": "...",
  "missingFields": []
}
```
The frontend keeps `conversationId` while `status === "AWAITING_INFO"`
and clears it on `COMPLETED` so the next message starts a fresh
extraction.

`GET /agenda?userId=u1` — read-only event list, **no LLM in the loop**:
```json
[
  { "id": 1, "date": "2026-04-28", "beginTime": "13:00:00",
    "endTime": "14:00:00", "type": "PERSONAL", "title": "Lunch with Alex" }
]
```
This is what the `/schedule` page renders. By design the LLM never
fabricates the visualisation — the page reads straight from the DB.

## Healthcheck (startup)

`api/healthcheck.ts` sends a probe `POST /chat` at app start to verify
the full chain: network → API → LLM. The status is exposed via
`ApiHealthContext` and drives:

- the AppBar pill (`Connecting…` / `Online` / `Offline`)
- the chat input (disabled when offline)
- a red `OfflineBanner` above the input with a "Retry" button
- `reportFailure()` flips the app to offline if a real `/chat` call
  fails or returns an empty body, and re-runs the probe in the
  background.

## userId persistence

`hooks/useUserId.ts` loads the userId from AsyncStorage on mount and
generates + persists one if absent. AsyncStorage falls back to
`localStorage` on web. Until it resolves, `useUserId()` returns `null`
and the chat input is disabled (`ready = online && userId !== null`).

This is critical: without persistence the userId is randomized on every
reload and `findByUserId` returns 0 events — the LLM can then make up
a fake schedule.

## Markdown-lite rendering

Bot replies often contain Markdown (`**bold**`, bullet lists, line
breaks). `components/RichText.tsx` parses these into native `<Text>` and
`<View>` elements — no markdown library needed. Supports:

- `**bold**`, `*italic*`
- bullet items prefixed with `- `, `* ` or `• `
- blank lines as paragraph spacers

User bubbles render as plain `<Text>` (no parsing — their content
shouldn't be interpreted as Markdown).

## API base URL resolution

`api/constants.ts` resolves the base URL in this order:

1. `process.env.EXPO_PUBLIC_API_URL` — baked at bundle time. Set as a
   build arg in Docker so the same image is reused across environments.
2. Hardcoded fallback (`http://localhost:8080`) — for local dev.

When testing on **emulator/native**, `localhost` won't work. Use:
- Android emulator → `http://10.0.2.2:8080`
- iOS simulator → `http://localhost:8080` (works)
- Physical device on Wi-Fi → your Mac's LAN IP

## Running

```bash
npm install
npm run web        # browser, fastest dev loop
npm run ios        # Xcode required
npm run android    # Android Studio required
npm run typecheck
npm run build:web  # produces dist/
```

If Metro chokes with `EMFILE: too many open files`, install Watchman
(`brew install watchman`). `metro.config.js` already restricts watching
to the project root.

## Deployment

**Two independent stacks**, deployed separately. The web app and the
API don't share a docker-compose file — the Android client and the
browser both hit `https://jimi-api.julsql.fr` the same way, so the API
must stand on its own.

- `jimi_app/docker-compose.yml` runs only the `app` container (Expo
  Web bundle served by an internal nginx). Bound to
  `127.0.0.1:${APP_PORT:-8101}:80`.
- `jimi_api/docker-compose.yml` runs `api` + `db` (MariaDB). The api is
  bound to `127.0.0.1:${API_PORT:-8102}:8080`. The DB stays inside the
  Docker bridge network — never exposed on the host.

Both are reverse-proxied by the host's system nginx:

```
jimi.julsql.fr      →  127.0.0.1:8101  →  app container
jimi-api.julsql.fr  →  127.0.0.1:8102  →  api container
```

`infra/nginx/` ships drop-in vhosts for both domains.
`certbot --nginx -d <fqdn>` once per domain.

**No registry pulls of JIMI-specific images.** Every Dockerfile is
built locally from source on the server. Only generic upstream images
are fetched (`mariadb:11`, `node:20-alpine`, `nginx:1.27-alpine`,
`maven:3.9-eclipse-temurin-17`, `eclipse-temurin:17-jre`). The compose
files use `build:` only — no `image: jimi-*:latest` aliases.

The Dockerfile in this repo passes `EXPO_PUBLIC_API_URL` as a
`--build-arg`, so the public API URL is baked into the JS bundle at
build time.

## Conventions

- No new dependencies for icons — keep using `View`/`Text` shapes
  (calendar icon in AppBar is built from primitives).
- Strict TypeScript: no `any` unless unavoidable; prefer typed parsers
  (`parseChatResponse`, `parseEvent`) over casting.
- Brand hex stays exact: `#f8711e` (accent), `#f88f4e` (accentLight) —
  see `theme/styles.ts`.
- Routes go in `app/<route>.tsx`. After adding one, you may need to add
  it to `.expo/types/router.d.ts` if `npm run typecheck` complains.
- Memory of past sessions: this app's userId once was randomized per
  session, which masked an LLM-hallucination bug as "fake schedule
  shown". Don't drop the AsyncStorage persistence to "simplify" things.
