export type Sender = 'User' | 'Chatbot';

export interface MessageModel {
  content: string;
  sender: Sender;
  timestamp?: number;
}

export interface ChatModel {
  messages: MessageModel[];
}

export type ChatStatus = 'AWAITING_INFO' | 'COMPLETED';

export interface ChatApiResponse {
  conversationId: string | null;
  status: ChatStatus;
  message: string;
  missingFields: string[];
}

// Parses the POST /chat response shape:
//   { conversationId, status, message, missingFields }
// Falls back to safe defaults when the payload is malformed so callers can
// detect "empty LLM reply" by checking message === ''.
export function parseChatResponse(payload: unknown): ChatApiResponse {
  if (!payload || typeof payload !== 'object') {
    return { conversationId: null, status: 'COMPLETED', message: '', missingFields: [] };
  }
  const obj = payload as Record<string, unknown>;

  const conversationId =
    typeof obj.conversationId === 'string' ? obj.conversationId : null;

  const status: ChatStatus =
    obj.status === 'AWAITING_INFO' ? 'AWAITING_INFO' : 'COMPLETED';

  const message = typeof obj.message === 'string' ? obj.message : '';

  const missingFields = Array.isArray(obj.missingFields)
    ? obj.missingFields.filter((f): f is string => typeof f === 'string')
    : [];

  return { conversationId, status, message, missingFields };
}
