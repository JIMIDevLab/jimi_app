import { ApiConstants } from './constants';
import { ChatApiResponse, parseChatResponse } from '../models/Message';

interface ChatRequestBody {
  userId: string;
  message: string;
  conversationId: string | null;
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
  const body: ChatRequestBody = { userId, message, conversationId };
  const json = await postApi<unknown>(ApiConstants.sendMessage, body);
  return parseChatResponse(json);
}
