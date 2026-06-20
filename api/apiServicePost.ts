import { ApiConstants } from './constants';
import { ChatApiResponse, parseChatResponse } from '../models/Message';

interface ChatRequestBody {
  userId: string;
  message: string;
  conversationId: string | null;
  // This app is the calendar-aware client: opt into connected-calendar mode
  // (NEEDS_CONNECTION + confirmation). Omitting it would get the API's legacy
  // local-DB behaviour, reserved for the older deployed apps.
  calendarMode: true;
  // The device's IANA timezone (e.g. "Europe/Paris") so the server resolves
  // "today"/"now" and creates events in the user's own timezone.
  timezone: string;
}

// The device timezone, used so dates/times are resolved where the user is.
// Intl is available on web and on React Native (Hermes); fall back to UTC.
function deviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

interface ConfirmRequestBody {
  userId: string;
  conversationId: string;
  confirmed: boolean;
}

async function postApi<T>(endpoint: string, body: unknown): Promise<T> {
  const res = await fetch(`${ApiConstants.baseUrl}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Request failed with ${res.status}`);
  }
  return (await res.json()) as T;
}

// Sends one /chat turn. The frontend now sends only the latest user message;
// the server keeps multi-turn state under `conversationId`. Pass back the
// `conversationId` from the previous response when continuing a draft.
export async function sendMessage(
  message: string,
  userId: string,
  conversationId: string | null = null,
): Promise<ChatApiResponse> {
  const body: ChatRequestBody = {
    userId,
    message,
    conversationId,
    calendarMode: true,
    timezone: deviceTimezone(),
  };
  const json = await postApi<unknown>(ApiConstants.sendMessage, body);
  return parseChatResponse(json);
}

// Confirms (or declines) a destructive action JIMI proposed. The server
// executes it on the recorded event ids — the LLM is not consulted here.
export async function confirmAction(
  userId: string,
  conversationId: string,
  confirmed: boolean,
): Promise<ChatApiResponse> {
  const body: ConfirmRequestBody = { userId, conversationId, confirmed };
  const json = await postApi<unknown>(ApiConstants.confirm, body);
  return parseChatResponse(json);
}
