import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { checkApiHealth, HealthCheckError } from '../api/healthcheck';

export type ApiStatus = 'checking' | 'online' | 'offline';

interface ApiHealthState {
  status: ApiStatus;
  errorReason: string | null;
  // Manually re-run the healthcheck (e.g. retry button after offline).
  recheck: () => void;
  // Called by the chat screen when an actual /chat call fails — we flip to
  // offline immediately and re-run the probe in the background.
  reportFailure: (reason?: string) => void;
}

const ApiHealthContext = createContext<ApiHealthState | null>(null);

export function ApiHealthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ApiStatus>('checking');
  const [errorReason, setErrorReason] = useState<string | null>(null);
  // Guard against setState on unmounted component & stale-closure runs.
  const runIdRef = useRef(0);

  const runCheck = useCallback(async () => {
    const myRun = ++runIdRef.current;
    setStatus('checking');
    setErrorReason(null);
    try {
      await checkApiHealth();
      if (runIdRef.current !== myRun) return;
      setStatus('online');
      setErrorReason(null);
    } catch (err) {
      if (runIdRef.current !== myRun) return;
      const reason =
        err instanceof HealthCheckError
          ? friendlyReason(err)
          : err instanceof Error
            ? err.message
            : 'Unknown error';
      setStatus('offline');
      setErrorReason(reason);
    }
  }, []);

  const reportFailure = useCallback(
    (reason?: string) => {
      runIdRef.current++;
      setStatus('offline');
      setErrorReason(reason ?? "Couldn't reach Jimi");
      // Kick a fresh probe asynchronously — if it succeeds we'll flip back.
      void runCheck();
    },
    [runCheck],
  );

  useEffect(() => {
    void runCheck();
  }, [runCheck]);

  return (
    <ApiHealthContext.Provider
      value={{ status, errorReason, recheck: runCheck, reportFailure }}
    >
      {children}
    </ApiHealthContext.Provider>
  );
}

export function useApiHealth(): ApiHealthState {
  const ctx = useContext(ApiHealthContext);
  if (!ctx) {
    throw new Error('useApiHealth must be used within ApiHealthProvider');
  }
  return ctx;
}

function friendlyReason(err: HealthCheckError): string {
  switch (err.kind) {
    case 'timeout':
      return 'The Jimi API took too long to respond.';
    case 'network':
      return "We couldn't reach the Jimi API.";
    case 'http':
      return `The Jimi API returned an error${err.status ? ` (HTTP ${err.status})` : ''}.`;
    case 'llm':
      return "Jimi reached the API but the assistant isn't replying.";
    default:
      return 'Jimi is unavailable.';
  }
}
