# JIMI App

JIMI is a chatbot-driven calendar assistant. The user chats in
natural language ("Add a meeting tomorrow at 2pm", "What's on my
schedule today?"), the backend extracts the structured event and
either CRUDs the calendar or asks for missing fields. A separate
schedule page lists events straight from the database — no LLM in
the loop, no risk of hallucinated events.

This repo is the **client app**. One Expo / React Native codebase
runs on iOS, Android and Web. The Spring Boot backend lives in the
sibling [`jimi_api`](../jimi_api) repo.

The Android build is published on the Play Store:
<https://play.google.com/store/apps/details?id=fr.tsp.jimithechatbot>

## Table of contents

- [Stack](#stack)
- [Quickstart](#quickstart)
- [Project layout](#project-layout)
- [Routes](#routes)
- [Backend integration](#backend-integration)
- [Notable features](#notable-features)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [License](#license)
- [Authors](#authors)

## Stack

- **React Native 0.74** + **Expo SDK 51**
- **Expo Router** — file-based routing under `app/`
- **react-native-web** for the browser target
- **TypeScript strict**
- **AsyncStorage** for the persisted `userId` (so events stay
  associated with the same user across reloads)
- No icon library — small UI primitives are drawn from `View` /
  `Text` shapes

## Quickstart

```bash
git clone <this-repo>
cd jimi_app
npm install

# Web (recommended for dev — fastest reload)
npm run web

# Native simulators
npm run ios        # Xcode required
npm run android    # Android Studio required

# Type-check
npm run typecheck

# Static web build → dist/
npm run build:web
```

By default the app talks to `http://localhost:8080`. Point it
elsewhere by setting `EXPO_PUBLIC_API_URL` before the build:

```bash
EXPO_PUBLIC_API_URL=https://jimi-api.julsql.fr npm run build:web
```

(See [`api/constants.ts`](api/constants.ts) for the resolution
order.)

## Project layout

```
.
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
│   ├── AppBar.tsx              # logo + status pill + nav buttons
│   ├── ChatBubble.tsx          # one message bubble (RichText for bot)
│   ├── RichText.tsx            # Markdown-lite renderer
│   ├── EmptyChat.tsx           # initial state w/ suggestions
│   ├── TypingIndicator.tsx     # 3-dot animation
│   └── OfflineBanner.tsx       # red banner when API is offline
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
├── Dockerfile                  # multi-stage: npm build → nginx
├── docker-compose.yml          # production runtime (one container)
└── infra/nginx/                # host nginx vhost templates
```

## Routes

| Path        | Screen                                                     |
|-------------|------------------------------------------------------------|
| `/`         | Redirects to `/home`                                       |
| `/home`     | Chat with JIMI                                             |
| `/schedule` | Schedule list — straight from the DB (no LLM in the loop)  |
| `/about`    | About                                                      |
| `/error`    | Error page                                                 |

## Backend integration

Two endpoints, fully documented in
[`jimi_api/README.md`](../jimi_api/README.md):

### `POST /chat` — natural-language turn

```json
{ "userId": "u1", "message": "Add a meeting tomorrow at 2pm", "conversationId": null }
```

Response shape:

```json
{
  "conversationId": "<uuid|null>",
  "status": "AWAITING_INFO" | "COMPLETED",
  "message": "...",
  "missingFields": []
}
```

The app keeps `conversationId` while `status === "AWAITING_INFO"`
and clears it on `COMPLETED`, so multi-turn extraction works
without any client-side state machine.

### `GET /agenda?userId=u1` — read-only event list

```json
[
  {
    "id": 1,
    "date": "2026-04-29",
    "beginTime": "14:00:00",
    "endTime": "15:00:00",
    "type": "PRO",
    "title": "Meeting"
  }
]
```

The schedule page renders this directly — by design the LLM is
never involved in the visualisation, so it can't hallucinate.

## Notable features

### Persistent userId

`hooks/useUserId.ts` loads the `userId` from AsyncStorage on mount
(falls back to `localStorage` on web), generating + persisting a
fresh one if absent. Without persistence, the userId would
randomise on every reload and your events would appear lost.
Until storage resolves, `useUserId()` returns `null` and the chat
input is disabled.

### Healthcheck on startup

`api/healthcheck.ts` fires a probe `POST /chat` at app start to
verify the full chain (network → API → LLM). Status is exposed
through `ApiHealthContext` and drives:

- the AppBar pill (`Connecting…` / `Online` / `Offline`)
- the chat input (disabled when offline)
- a red `OfflineBanner` above the input with a "Retry" button
- `reportFailure()` flips the app to offline if a real `/chat`
  call fails or returns an empty body, and re-runs the probe in
  the background

### Markdown-lite rendering

Bot replies often contain Markdown: bold (`**...**`), italics
(`*...*`), bullet lists, line breaks. `components/RichText.tsx`
parses these into native `<Text>` and `<View>` elements — no
markdown library needed. User bubbles render as plain `<Text>`
(their content shouldn't be interpreted as Markdown).

### Anti-hallucination defenses

The schedule page deliberately uses the LLM-free `GET /agenda`
endpoint. The chat path also benefits from the backend's
hardcoded short-circuit when the agenda is empty, plus a strong
"never invent" preamble in the extraction prompt — see
[`jimi_api/global/Prompts.java`](../jimi_api/src/main/java/com/tsp/jimi_api/global/Prompts.java).

## Configuration

| Variable              | Purpose                            | Default                     |
|-----------------------|------------------------------------|-----------------------------|
| `EXPO_PUBLIC_API_URL` | Base URL of the JIMI API           | `http://localhost:8080`     |
| `APP_PORT`            | Host port for the Docker container | `8101`                      |

`EXPO_PUBLIC_API_URL` is baked into the JS bundle at build time —
it can't be changed at runtime without rebuilding.

When testing on **emulator/native**, `localhost` won't reach your
host machine. Use:

- Android emulator → `http://10.0.2.2:8080`
- iOS simulator → `http://localhost:8080` (works as-is)
- Physical device on Wi-Fi → your Mac's LAN IP

## Deployment

The runtime stack is `docker-compose.yml` (one `app` container —
multi-stage Dockerfile that runs `npm ci` + `npm run build:web`
then serves `dist/` with an internal nginx). The container is
bound to `127.0.0.1:${APP_PORT:-8101}:80` and the host's nginx
reverse-proxies `jimi.julsql.fr` onto that loopback port — see
[`infra/nginx/`](./infra/nginx) for the drop-in vhost.

> ⚠️ The `npm ci` step peaks at ~1 GB resident. On a small VPS,
> configure swap once before deploying:
> ```bash
> sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && \
>   sudo mkswap /swapfile && sudo swapon /swapfile && \
>   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
> ```

### One-time host setup

```bash
git clone https://github.com/<owner>/jimi_app.git /opt/jimi_app
cd /opt/jimi_app

cat > .env <<EOF
EXPO_PUBLIC_API_URL=https://jimi-api.julsql.fr
APP_PORT=8101
EOF

# Drop the host nginx vhost
sudo cp infra/nginx/jimi.julsql.fr.conf /etc/nginx/conf.d/
sudo certbot --nginx -d jimi.julsql.fr
sudo nginx -s reload
```

The user that runs `docker compose` must be in the `docker` group.

### Deploy with GitHub Actions

`.github/workflows/deploy.yml` runs on every push to `main` and on
manual dispatch. Configure these repository secrets
(*Settings → Secrets and variables → Actions*):

| Secret        | Example         |
|---------------|-----------------|
| `SSH_HOST`    | `your.server`   |
| `SSH_USER`    | `deploy`        |
| `SSH_KEY`     | the SSH **private** key authorized on the server |
| `DEPLOY_PATH` | `/opt/jimi_app` |

The workflow SSHes onto the server and runs:

```bash
cd $DEPLOY_PATH
git pull
docker compose down
docker compose build --no-cache
docker compose up -d
docker image prune -f
```

### Deploy manually

Same five commands, packaged in `deploy.sh`:

```bash
DEPLOY_HOST=deploy@your.server \
DEPLOY_PATH=/opt/jimi_app \
./deploy.sh
```

Or by hand:

```bash
ssh deploy@your.server
cd /opt/jimi_app
git pull
docker compose up -d --build
```

## License

MIT — see [LICENSE](./LICENSE).

## Authors

- Jul SQL
