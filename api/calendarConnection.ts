import * as WebBrowser from 'expo-web-browser';
import { ApiConstants } from './constants';

// Manages linking the user's real calendar (Google for now) and checking
// connection status. No calendar content is fetched here — JIMI reads/writes
// the calendar live on the server side; the app only triggers OAuth and asks
// "which providers are connected?".

const RETURN_URL = 'jimi://connected';

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

// Opens Google's consent screen in a secure auth session, then verifies the
// link by polling /connections (the server records the account during the
// OAuth callback). Returns true once the calendar is connected.
export async function connectGoogle(userId: string): Promise<boolean> {
  const authUrl =
    `${ApiConstants.baseUrl}${ApiConstants.connectGoogle}?userId=${encodeURIComponent(userId)}`;
  try {
    await WebBrowser.openAuthSessionAsync(authUrl, RETURN_URL);
  } catch {
    // Session may be dismissed without a clean return (esp. on web) — the
    // poll below is the source of truth either way.
  }
  return pollConnected(userId);
}

export async function disconnectGoogle(userId: string): Promise<void> {
  const url =
    `${ApiConstants.baseUrl}${ApiConstants.connectGoogle}?userId=${encodeURIComponent(userId)}`;
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
