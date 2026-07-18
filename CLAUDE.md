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
│   ├── home.tsx                # Chat screen (drives connect/confirm actions)
│   ├── about.tsx               # About
│   └── error.tsx               # Error page
│   # NOTE: there is no in-app calendar view. The AppBar calendar button
│   # deep-links to the device's native calendar app (api/nativeCalendar.ts).
├── api/
│   ├── constants.ts            # baseUrl + endpoint paths
│   ├── apiServicePost.ts       # POST /chat + POST /chat/confirm clients
│   ├── calendarConnection.ts   # multi-provider connect (OAuth + CalDAV) + GET/DELETE /connections
│   ├── nativeCalendar.ts       # deep-link into the device calendar app
│   └── healthcheck.ts          # /chat probe used at startup
├── components/
│   ├── AppBar.tsx              # logo + status pill + calendar/info buttons
│   ├── ChatBubble.tsx          # one message bubble (uses RichText for bot)
│   ├── ChatActions.tsx         # inline buttons: connect / confirm / open event
│   ├── ConnectCalendarSheet.tsx# provider picker (Google/Microsoft OAuth + CalDAV form)
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
└── docker-compose.yml          # local dev runtime (one app container)
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
  "status": "AWAITING_INFO" | "AWAITING_CONFIRMATION" | "NEEDS_CONNECTION" | "COMPLETED" | "CANCELLED",
  "message": "...",
  "missingFields": [],
  "eventUrl": "<deep link to the event|null>"
}
```
Status drives the inline action attached to the bot bubble (see
`components/ChatActions.tsx` + `toBotMessage` in `home.tsx`):
- `AWAITING_INFO` → keep `conversationId`, ask for the missing fields.
- `NEEDS_CONNECTION` → show a single "Connect a calendar" button that opens a
  provider picker (`components/ConnectCalendarSheet.tsx`):
    - **Google Calendar** / **Outlook / Microsoft 365** → OAuth in a browser
      session (`connectOAuth(userId, provider)`), then poll `/connections`.
    - **Apple iCloud / Other (CalDAV)** → a credentials form (server URL,
      username, app-specific password) that POSTs to `/connect/caldav`
      (`connectCalDav`) and shows inline errors on failure.
  On any success the picker closes, a "calendar connected" bot message is
  posted, and the triggering message is replayed (`finishConnect` in
  `home.tsx`).
- `AWAITING_CONFIRMATION` → show Confirm/Cancel; they call
  `POST /chat/confirm { userId, conversationId, confirmed }`. The
  `conversationId` lives in the message action, NOT in the shared ref, so
  typing a new message starts a fresh extraction.
- `COMPLETED` with `eventUrl` → "Open in calendar".

There is **no `/agenda` endpoint and no in-app list** anymore: the user's real
calendar is the source of truth. The AppBar calendar button deep-links to the
native calendar app (`api/nativeCalendar.ts`).

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

Deploys run entirely through GHCR + k3s — no SSH, no host checkout.

- **CI** (`.github/workflows/docker.yml`) builds this repo's Dockerfile
  on every push to `main` and pushes the image to GHCR
  (`ghcr.io/<owner>/jimi-app`, tags `latest` + `sha-<commit>`). The
  Dockerfile bakes `EXPO_PUBLIC_API_URL` in as a `--build-arg`, so the
  public API URL is fixed at build time.
- **k3s + Keel**: the cluster runs [Keel](https://keel.sh), which polls
  GHCR and rolls out the Deployment whenever the `latest` digest
  changes. Merging to `main` is the whole deploy.
- The k8s manifests (Deployment/Service/Ingress) live in the separate
  **`k3s-manifests`** repo, not here.

`docker-compose.yml` in this repo is **local dev only** (one `app`
container serving the Expo Web bundle on `${APP_PORT:-8101}:80`); it
is not used to deploy.

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
