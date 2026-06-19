import { Platform } from 'react-native';
import * as Linking from 'expo-linking';

// JIMI deliberately has no in-app calendar view: the user's real calendar is
// the source of truth, so we deep-link straight into the device's calendar app
// (native), or open the web calendar in a NEW TAB on web so the JIMI app stays
// open in the current tab.

const IOS_CALENDAR = 'calshow:'; // opens Apple Calendar at "today"
const ANDROID_CALENDAR = 'content://com.android.calendar/time/';
const WEB_CALENDAR = 'https://calendar.google.com';

// Opens a URL externally. On web that means a new browser tab (so the running
// JIMI app isn't navigated away); on native it hands off to the OS.
async function openExternal(url: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && typeof window.open === 'function') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
  }
  await Linking.openURL(url).catch(() => undefined);
}

export async function openNativeCalendar(): Promise<void> {
  if (Platform.OS === 'web') {
    // Web has no native calendar app — open the web calendar in a new tab.
    await openExternal(WEB_CALENDAR);
    return;
  }
  const target = Platform.OS === 'ios' ? IOS_CALENDAR : ANDROID_CALENDAR;
  try {
    await Linking.openURL(target);
  } catch {
    // Fallback to the web calendar if the native scheme can't be opened.
    await Linking.openURL(WEB_CALENDAR).catch(() => undefined);
  }
}

// Opens a specific event by its provider deep link (e.g. Google htmlLink).
// New tab on web, OS handoff on native.
export async function openEvent(url: string): Promise<void> {
  await openExternal(url);
}
