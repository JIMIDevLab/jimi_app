import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'jimi.userId';

function generateUserId(): string {
  return Math.floor(Math.random() * 100000).toString();
}

// Loads the persisted userId on mount, generating + storing one the first
// time. Returns `null` while loading so callers can disable input until the
// id is ready (avoids racing the first /chat call against AsyncStorage).
export function useUserId(): string | null {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const existing = await AsyncStorage.getItem(STORAGE_KEY);
        if (existing && existing.length > 0) {
          if (!cancelled) setUserId(existing);
          return;
        }
        const fresh = generateUserId();
        await AsyncStorage.setItem(STORAGE_KEY, fresh);
        if (!cancelled) setUserId(fresh);
      } catch {
        // Storage failed (private mode on Safari, etc.) — fall back to a
        // session-only id so the app still works, just without persistence.
        if (!cancelled) setUserId(generateUserId());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return userId;
}
