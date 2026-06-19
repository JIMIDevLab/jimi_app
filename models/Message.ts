export type Sender = 'User' | 'Chatbot';

// Inline action a bot message can offer, driven by the server status:
//   - 'connect'   → NEEDS_CONNECTION: a "Connect your calendar" button.
//   - 'confirm'   → AWAITING_CONFIRMATION: Confirm / Cancel for an edit/delete.
//   - 'openEvent' → COMPLETED with an eventUrl: open it in the calendar.
export interface MessageAction {
  kind: 'connect' | 'confirm' | 'openEvent';
  // Conversation to confirm/cancel (kind === 'confirm').
  conversationId?: string;
  // Deep link to the affected event (kind === 'openEvent').
  eventUrl?: string;
  // The user message to replay once a calendar is connected (kind === 'connect').
  retryMessage?: string;
}

export interface MessageModel {
  content: string;
  sender: Sender;
  timestamp?: number;
  action?: MessageAction;
}

export interface ChatModel {
  messages: MessageModel[];
}

export type ChatStatus =
  | 'AWAITING_INFO'
  | 'AWAITING_CONFIRMATION'
  | 'NEEDS_CONNECTION'
  | 'COMPLETED'
  | 'CANCELLED';

const KNOWN_STATUSES: ChatStatus[] = [
  'AWAITING_INFO',
  'AWAITING_CONFIRMATION',
  'NEEDS_CONNECTION',
  'COMPLETED',
  'CANCELLED',
];

export interface ChatApiResponse {
  conversationId: string | null;
  status: ChatStatus;
  message: string;
  missingFields: string[];
  eventUrl: string | null;
}

// Parses the POST /chat (and /chat/confirm) response shape:
//   { conversationId, status, message, missingFields, eventUrl }
// Falls back to safe defaults when the payload is malformed so callers can
// detect "empty reply" by checking message === ''.
export function parseChatResponse(payload: unknown): ChatApiResponse {
  if (!payload || typeof payload !== 'object') {
    return {
      conversationId: null,
      status: 'COMPLETED',
      message: '',
      missingFields: [],
      eventUrl: null,
    };
  }
  const obj = payload as Record<string, unknown>;

  const conversationId =
    typeof obj.conversationId === 'string' ? obj.conversationId : null;

  const status: ChatStatus =
    typeof obj.status === 'string' && (KNOWN_STATUSES as string[]).includes(obj.status)
      ? (obj.status as ChatStatus)
      : 'COMPLETED';

  const message = typeof obj.message === 'string' ? obj.message : '';

  const missingFields = Array.isArray(obj.missingFields)
    ? obj.missingFields.filter((f): f is string => typeof f === 'string')
    : [];

  const eventUrl = typeof obj.eventUrl === 'string' ? obj.eventUrl : null;

  return { conversationId, status, message, missingFields, eventUrl };
}
