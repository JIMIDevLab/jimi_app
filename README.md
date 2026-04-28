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
- [Android release build](#android-release-build)
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

## Android release build

End-to-end procedure for shipping a new version of the Android app
to the Play Store (`fr.tsp.jimithechatbot`). The Play Store
listing is bound to the existing upload signing key — **always
reuse the same keystore**; rotating it would force republishing as
a brand-new app and lose the install base.

### Prerequisites

Once per machine:

- **Android SDK** installed (Android Studio is the easiest way).
  Either export `ANDROID_HOME=$HOME/Library/Android/sdk` in your
  shell, or create `android/local.properties` with
  `sdk.dir=/Users/<you>/Library/Android/sdk`.
- **JDK 17** (bundled with recent Android Studio).
- **Keystore file** copied to `android/app/jimi-release.keystore`
  (gitignored via `android/app/*.keystore` — never commit it).
- **Signing credentials** in `~/.gradle/gradle.properties`
  (Gradle's user-level file, read automatically on every build,
  outside any repo):

  ```properties
  # ~/.gradle/gradle.properties
  JIMI_UPLOAD_STORE_FILE=jimi-release.keystore
  JIMI_UPLOAD_KEY_ALIAS=<alias>
  JIMI_UPLOAD_STORE_PASSWORD=<keystore password>
  JIMI_UPLOAD_KEY_PASSWORD=<key password>
  ```

  `android/app/build.gradle` reads them via `signingConfigs.release`.
  If any of the four is missing, `bundleRelease` errors out with
  *"Keystore file not set for signing config release"*.

> ⚠️ Losing the keystore means losing the ability to publish
> updates ever again. Back it up outside this machine (password
> manager, encrypted vault, etc.).

### Release procedure

**1. Bump the version in [`app.json`](./app.json)**

```jsonc
{
  "expo": {
    "version": "2.0.4",                 // human-readable, semver
    "android": {
      "package": "fr.tsp.jimithechatbot",
      "versionCode": 5                  // strictly > last live value
    }
  }
}
```

`versionCode` must be a strictly increasing integer — Play Console
rejects equal or lower values. Check the current live code in Play
Console → *Production* → latest release.

**2. Sync the native project**

```bash
EXPO_PUBLIC_API_URL=https://jimi-api.julsql.fr \
  npx expo prebuild --platform android
```

This propagates `app.json` (icon, version, package) into the
`android/` Gradle project and bakes the prod API URL into the JS
bundle. Re-run it whenever `app.json` or `assets/images/logo.png`
changes.

**3. Build the signed AAB**

```bash
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`
(typically 30–50 MB, ~3–5 min on a recent Mac). Gradle automatically
signs it using the credentials from `~/.gradle/gradle.properties`.

**4. Smoke-test the build (optional but recommended)**

The AAB itself can't be installed directly — it's a Play Store
distribution format. Two ways to verify:

- **APK fallback** for local testing — `./gradlew assembleRelease`
  produces a signed APK at
  `android/app/build/outputs/apk/release/app-release.apk`.
  Install it on a device/emulator with
  `adb install -r app-release.apk`.
- **Internal testing track** on Play Console — upload the AAB,
  add yourself as a tester, install via the opt-in URL. This is
  the closest to what real users will receive.

**5. Upload to Play Console**

[Play Console](https://play.google.com/console) → JIMI →
*Production* (or *Internal testing* / *Closed testing* for staged
rollouts) → *Create new release* → upload the `.aab` → fill in
the release notes → *Review release* → *Start rollout*.

For risk-averse releases, start the rollout at 10–20% and ramp up
over a few days while watching the *Crashes & ANRs* dashboard.

**6. Tag the release in git**

```bash
git add app.json
git commit -m "release: android 2.0.4 (versionCode 5)"
git tag -a android-v2.0.4 -m "Android 2.0.4"
git push && git push --tags
```

Tagging makes it easy to rebuild the exact AAB later if the Play
Store ever asks you to re-upload.

### Troubleshooting

| Symptom                                                            | Cause                                                          | Fix                                                                                       |
|--------------------------------------------------------------------|----------------------------------------------------------------|-------------------------------------------------------------------------------------------|
| `SDK location not found`                                           | `ANDROID_HOME` not set and no `android/local.properties`       | Export `ANDROID_HOME` or create `local.properties` (see *Prerequisites*).                 |
| `Keystore file not set for signing config release`                 | `~/.gradle/gradle.properties` missing or incomplete            | Re-create it with all four `JIMI_UPLOAD_*` properties.                                    |
| `Version code X has already been used`                             | `versionCode` in `app.json` is not above the last live one     | Bump `android.versionCode` and rerun `prebuild` + `bundleRelease`.                        |
| Play Console: *"Your APK or Android App Bundle is not signed…"*    | A previous build wasn't signed (e.g. a `JIMI_UPLOAD_*` typo)   | Verify with `jarsigner -verify -verbose app-release.aab` then rebuild.                    |
| App installs but immediately crashes / blank screen                | API URL not baked at build time                                | Always pass `EXPO_PUBLIC_API_URL=...` on the `prebuild` line, not on `gradlew`.           |

## License

MIT — see [LICENSE](./LICENSE).

## Authors

- Jul SQL
