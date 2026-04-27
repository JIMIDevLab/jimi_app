import { ApiConstants } from './constants';
import { parseChatResponse } from '../models/Message';

const HEALTHCHECK_TIMEOUT_MS = 12000;
const HEALTHCHECK_USER_ID = '__healthcheck__';
const HEALTHCHECK_PROMPT = 'ping';

export type HealthFailureKind = 'network' | 'http' | 'llm' | 'timeout';

export class HealthCheckError extends Error {
  constructor(
    message: string,
    public readonly kind: HealthFailureKind,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'HealthCheckError';
  }
}

// Hits POST /chat with a probe payload to verify the full chain:
// network → API → LLM. We treat an empty `message` field as an LLM outage
// because /chat answering 200 with no content means the backend reached
// the model but got nothing back.
export async function checkApiHealth(): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(new Error('timeout')),
    HEALTHCHECK_TIMEOUT_MS,
  );

  let res: Response;
  try {
    res = await fetch(`${ApiConstants.baseUrl}${ApiConstants.sendMessage}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: HEALTHCHECK_USER_ID,
        message: HEALTHCHECK_PROMPT,
        conversationId: null,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (controller.signal.aborted) {
      throw new HealthCheckError('Request timed out', 'timeout');
    }
    throw new HealthCheckError(
      err instanceof Error ? err.message : 'Network error',
      'network',
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    throw new HealthCheckError(
      `API responded with HTTP ${res.status}`,
      'http',
      res.status,
    );
  }

  let parsed: unknown;
  try {
    parsed = await res.json();
  } catch {
    throw new HealthCheckError('API response was not valid JSON', 'llm');
  }

  const answer = parseChatResponse(parsed);
  if (!answer.message || answer.message.trim().length === 0) {
    throw new HealthCheckError('LLM returned an empty response', 'llm');
  }
}
