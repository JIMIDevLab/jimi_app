// Base URL of the JIMI Spring Boot API.
//
// `EXPO_PUBLIC_API_URL` is baked into the JS bundle at build time. It must be
// provided by:
//   - `.env` for local Metro / `expo run:*`
//   - `eas.json` `env` block for EAS builds (App Store / TestFlight)
//   - `--build-arg` for the Docker web image
//
// In dev (Metro), we fall back to localhost so a missing `.env` doesn't block
// quick iteration. In any non-dev build (Release IPA / APK / web), we refuse
// to start: a previous App Store reject was caused by the localhost fallback
// shipping in a Release binary.
const DEV_FALLBACK_BASE_URL = 'http://localhost:8080';

function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  if (__DEV__) return DEV_FALLBACK_BASE_URL;
  throw new Error(
    'EXPO_PUBLIC_API_URL is not defined in this Release build. ' +
      'Set it in eas.json (env block) or as a Docker build-arg.',
  );
}

export const ApiConstants = {
  baseUrl: resolveBaseUrl(),
  sendMessage: '/chat',
  confirm: '/chat/confirm',
  config: '/config',
  connections: '/connections',
  // OAuth providers share the same /connect/{provider} shape; CalDAV is a
  // dedicated credentials POST. `connect(provider)` builds the path so callers
  // never hardcode it.
  connect: (provider: string) => `/connect/${provider}`,
  connectGoogle: '/connect/google',
  connectMicrosoft: '/connect/microsoft',
  connectCalDav: '/connect/caldav',
} as const;
