import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { ApiConstants } from './constants';

// Manages linking the user's real calendar and checking connection status.
// No calendar content is fetched here — JIMI reads/writes the calendar live on
// the server side; the app only triggers the connect flow and asks "which
// providers are connected?".
//
// Two connect shapes:
//   - OAuth  (Google, Microsoft) → open the provider consent screen in a
//     secure browser session, then poll /connections (the server records the
//     account during the OAuth callback).
//   - CalDAV (Apple iCloud / other) → POST credentials directly; the server
//     validates them and replies synchronously, so no polling is needed.

// Where the OAuth callback should bounce the user back to. On native this is
// the app's custom scheme (jimi://connected); on web it's the app's own https
// origin (e.g. https://jimi.julsql.fr/connected). We send it to the server so
// it redirects there — without this the web app got "Safari cannot open
// jimi://connected" and the connection never confirmed.
function buildReturnUrl(): string {
  return Linking.createURL('connected');
}

// OAuth providers. CalDAV is intentionally excluded — it has a different,
// credentials-based flow and is handled by `connectCalDav`.
export type OAuthProvider = 'google' | 'microsoft';
export type CalendarProvider = OAuthProvider | 'caldav';

export interface CalDavCredentials {
  serverUrl: string;
  username: string;
  password: string;
}

export interface CalDavResult {
  ok: boolean;
  reason?: string;
}

export async function fetchConnectedProviders(userId: string): Promise<string[]> {
  const url = `${ApiConstants.baseUrl}${ApiConstants.connections}?userId=${encodeURIComponent(userId)}`;
  const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
  if (!res.ok) return [];
  const json = (await res.json()) as unknown;
  const providers = (json as { providers?: unknown })?.providers;
  return Array.isArray(providers)
    ? providers.filter((p): p is string => typeof p === 'string')
    : [];
}

export async function isCalendarConnected(userId: string): Promise<boolean> {
  return (await fetchConnectedProviders(userId)).length > 0;
}

// Opens the provider's consent screen in a secure auth session, then verifies
// the link by polling /connections. Returns true once the calendar is
// connected. Shared by Google and Microsoft — only the path differs.
export async function connectOAuth(
  userId: string,
  provider: OAuthProvider,
): Promise<boolean> {
  const returnUrl = buildReturnUrl();
  const authUrl =
    `${ApiConstants.baseUrl}${ApiConstants.connect(provider)}?userId=${encodeURIComponent(userId)}` +
    `&returnUrl=${encodeURIComponent(returnUrl)}`;
  try {
    await WebBrowser.openAuthSessionAsync(authUrl, returnUrl);
  } catch {
    // Session may be dismissed without a clean return (esp. on web) — the
    // poll below is the source of truth either way.
  }
  return pollConnected(userId);
}

// CalDAV uses credentials instead of OAuth: POST them and trust the server's
// synchronous verdict. Returns `{ ok }` plus a human-readable `reason` on
// failure so the form can surface it inline.
export async function connectCalDav(
  userId: string,
  credentials: CalDavCredentials,
): Promise<CalDavResult> {
  const url = `${ApiConstants.baseUrl}${ApiConstants.connectCalDav}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ userId, ...credentials }),
    });
    if (res.ok) {
      const json = (await res.json().catch(() => null)) as { connected?: unknown } | null;
      return { ok: json?.connected === true };
    }
    const err = (await res.json().catch(() => null)) as { reason?: unknown } | null;
    const reason = typeof err?.reason === 'string' ? err.reason : undefined;
    return { ok: false, reason };
  } catch {
    return { ok: false, reason: 'Network error — check the server URL and your connection.' };
  }
}

export async function disconnect(userId: string, provider: CalendarProvider): Promise<void> {
  const url =
    `${ApiConstants.baseUrl}${ApiConstants.connect(provider)}?userId=${encodeURIComponent(userId)}`;
  await fetch(url, { method: 'DELETE' });
}

async function pollConnected(userId: string, attempts = 5): Promise<boolean> {
  for (let i = 0; i < attempts; i++) {
    if (await isCalendarConnected(userId)) return true;
    await delay(600);
  }
  return false;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
