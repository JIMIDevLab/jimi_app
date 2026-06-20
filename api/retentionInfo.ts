import { ApiConstants } from './constants';

// Data-retention windows, fetched from the API so the Privacy Policy page shows
// the actual configured durations (the server's RETENTION_* env vars) rather
// than hard-coded numbers. Falls back to the documented defaults if the API is
// unreachable.

export interface RetentionInfo {
  userDays: number;
  contextDays: number;
}

const FALLBACK: RetentionInfo = { userDays: 180, contextDays: 30 };

export async function fetchRetentionInfo(): Promise<RetentionInfo> {
  try {
    const res = await fetch(`${ApiConstants.baseUrl}/privacy/retention`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return FALLBACK;
    const json = (await res.json()) as { userDays?: unknown; contextDays?: unknown };
    return {
      userDays: typeof json.userDays === 'number' ? json.userDays : FALLBACK.userDays,
      contextDays: typeof json.contextDays === 'number' ? json.contextDays : FALLBACK.contextDays,
    };
  } catch {
    return FALLBACK;
  }
}
