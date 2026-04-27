import { ApiConstants } from './constants';

export type AgendaEventType = 'PRO' | 'PERSONAL' | 'UNDEFINED';

export interface AgendaEvent {
  id: number;
  date: string | null;       // YYYY-MM-DD
  beginTime: string | null;  // HH:mm:ss
  endTime: string | null;    // HH:mm:ss
  type: AgendaEventType | null;
  title: string | null;
}

// GET /agenda?userId=...
// Returns the user's events sorted by (date, begin_time). No LLM involved.
export async function fetchAgenda(userId: string): Promise<AgendaEvent[]> {
  const url = `${ApiConstants.baseUrl}/agenda?userId=${encodeURIComponent(userId)}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Request failed with ${res.status}`);
  }
  const json = (await res.json()) as unknown;
  if (!Array.isArray(json)) return [];
  return json.map(parseEvent).filter((e): e is AgendaEvent => e !== null);
}

function parseEvent(raw: unknown): AgendaEvent | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  return {
    id: typeof obj.id === 'number' ? obj.id : 0,
    date: typeof obj.date === 'string' ? obj.date : null,
    beginTime: typeof obj.beginTime === 'string' ? obj.beginTime : null,
    endTime: typeof obj.endTime === 'string' ? obj.endTime : null,
    type:
      obj.type === 'PRO' || obj.type === 'PERSONAL' || obj.type === 'UNDEFINED'
        ? obj.type
        : null,
    title: typeof obj.title === 'string' ? obj.title : null,
  };
}
