import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { fetchConnectedProviders } from './calendarConnection';

// JIMI deliberately has no in-app calendar view: the user's real calendar is
// the source of truth, so we open it directly — the device's calendar app on
// native, or the connected provider's web calendar in a NEW TAB on web.

const IOS_CALENDAR = 'calshow:'; // opens Apple Calendar at "today"
const ANDROID_CALENDAR = 'content://com.android.calendar/time/';

// Web calendar of each provider, so the icon opens the calendar you connected
// (not always Google). The browser uses whichever account you're signed into.
const WEB_CALENDAR: Record<string, string> = {
  google: 'https://calendar.google.com',
  microsoft: 'https://outlook.office.com/calendar/',
  caldav: 'https://www.icloud.com/calendar/', // Apple iCloud (most common CalDAV)
};
const DEFAULT_WEB_CALENDAR = WEB_CALENDAR.google;

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

// Opens the calendar of the provider the user has connected. On web that's the
// matching web calendar (Google / Outlook / iCloud); on native it's the device
// calendar app, which already shows the connected account.
export async function openConnectedCalendar(userId: string | null): Promise<void> {
  if (Platform.OS !== 'web') {
    await openNativeCalendar();
    return;
  }
  let url = DEFAULT_WEB_CALENDAR;
  if (userId) {
    try {
      const providers = await fetchConnectedProviders(userId);
      const provider = providers.find((p) => WEB_CALENDAR[p]);
      if (provider) url = WEB_CALENDAR[provider];
    } catch {
      // fall back to the default web calendar
    }
  }
  await openExternal(url);
}

export async function openNativeCalendar(): Promise<void> {
  if (Platform.OS === 'web') {
    await openExternal(DEFAULT_WEB_CALENDAR);
    return;
  }
  const target = Platform.OS === 'ios' ? IOS_CALENDAR : ANDROID_CALENDAR;
  try {
    await Linking.openURL(target);
  } catch {
    // Fallback to the web calendar if the native scheme can't be opened.
    await Linking.openURL(DEFAULT_WEB_CALENDAR).catch(() => undefined);
  }
}

// Opens a specific event by its provider deep link (e.g. Google htmlLink).
// New tab on web, OS handoff on native.
export async function openEvent(url: string): Promise<void> {
  await openExternal(url);
}
