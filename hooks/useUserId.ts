import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'jimi.userId';
const subscribers = new Set<(id: string) => void>();

function generateUserId(): string {
  return Math.floor(Math.random() * 100000).toString();
}

// Generates a brand-new userId, persists it, and notifies every live
// useUserId() hook so they swap to it without remounting. Used after
// "delete my data" to make the in-session user effectively new.
export async function resetUserId(): Promise<string> {
  const fresh = generateUserId();
  try {
    await AsyncStorage.setItem(STORAGE_KEY, fresh);
  } catch {
    // Storage write failed (private-mode Safari, etc.) — still notify so
    // the in-memory id rotates for this session.
  }
  subscribers.forEach((s) => s(fresh));
  return fresh;
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

  useEffect(() => {
    const onChange = (id: string) => setUserId(id);
    subscribers.add(onChange);
    return () => {
      subscribers.delete(onChange);
    };
  }, []);

  return userId;
}
