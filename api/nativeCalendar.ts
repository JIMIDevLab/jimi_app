import { Platform } from 'react-native';
import * as Linking from 'expo-linking';

// JIMI deliberately has no in-app calendar view: the user's real calendar is
// the source of truth, so we deep-link straight into the device's calendar app.

const IOS_CALENDAR = 'calshow:'; // opens Apple Calendar at "today"
const ANDROID_CALENDAR = 'content://com.android.calendar/time/';
const WEB_CALENDAR = 'https://calendar.google.com';

export async function openNativeCalendar(): Promise<void> {
  const target =
    Platform.OS === 'ios'
      ? IOS_CALENDAR
      : Platform.OS === 'android'
        ? ANDROID_CALENDAR
        : WEB_CALENDAR;
  try {
    await Linking.openURL(target);
  } catch {
    // Fallback to the web calendar if the native scheme can't be opened.
    if (Platform.OS !== 'web') {
      await Linking.openURL(WEB_CALENDAR).catch(() => undefined);
    }
  }
}

// Opens a specific event by its provider deep link (e.g. Google htmlLink).
export async function openEvent(url: string): Promise<void> {
  await Linking.openURL(url).catch(() => undefined);
}
