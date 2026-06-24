import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, radius, shadow, spacing, typography } from '../theme/styles';
import type {
  CalDavCredentials,
  CalDavResult,
  CalendarProvider,
  OAuthProvider,
} from '../api/calendarConnection';

interface Props {
  visible: boolean;
  // Providers the deployment currently offers (from GET /config). null = not
  // loaded yet → show all (the API's /connect guard still refuses disabled ones).
  enabledProviders: CalendarProvider[] | null;
  onClose: () => void;
  // Runs the OAuth flow for the chosen provider; resolves true once linked.
  onConnectOAuth: (provider: OAuthProvider) => Promise<boolean>;
  // Submits CalDAV credentials; resolves the server verdict.
  onConnectCalDav: (credentials: CalDavCredentials) => Promise<CalDavResult>;
}

type View_ = 'picker' | 'caldav';

// Bottom-sheet style picker that lets the user choose which calendar to link.
// OAuth providers (Google, Microsoft) hand off to a browser session; CalDAV
// collects credentials inline. On any success the parent closes the sheet and
// drives the "calendar connected" follow-up, so this component only reports
// outcomes via the callbacks.
export function ConnectCalendarSheet({
  visible,
  enabledProviders,
  onClose,
  onConnectOAuth,
  onConnectCalDav,
}: Props) {
  // null = config not loaded yet → treat everything as enabled (the API's
  // /connect guard still refuses a disabled provider as a backstop).
  const isEnabled = (provider: CalendarProvider) =>
    enabledProviders === null || enabledProviders.includes(provider);

  // Tapping a disabled (greyed) provider doesn't start its flow — it just
  // surfaces why it's unavailable.
  const showUnavailable = useCallback((label: string) => {
    setError(`${label} is currently unavailable. Please pick another calendar.`);
  }, []);
  const [view, setView] = useState<View_>('picker');
  const [busy, setBusy] = useState<OAuthProvider | 'caldav' | null>(null);
  const [serverUrl, setServerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setView('picker');
    setBusy(null);
    setServerUrl('');
    setUsername('');
    setPassword('');
    setError(null);
  }, []);

  const close = useCallback(() => {
    if (busy) return;
    reset();
    onClose();
  }, [busy, reset, onClose]);

  const handleOAuth = useCallback(
    async (provider: OAuthProvider) => {
      if (busy) return;
      setError(null);
      setBusy(provider);
      try {
        const ok = await onConnectOAuth(provider);
        if (ok) {
          reset();
        } else {
          setError("We couldn't confirm the connection. Please try again.");
        }
      } finally {
        setBusy(null);
      }
    },
    [busy, onConnectOAuth, reset],
  );

  const handleCalDav = useCallback(async () => {
    if (busy) return;
    if (!serverUrl.trim() || !username.trim() || !password) {
      setError('Please fill in the server URL, username and password.');
      return;
    }
    setError(null);
    setBusy('caldav');
    try {
      const result = await onConnectCalDav({
        serverUrl: serverUrl.trim(),
        username: username.trim(),
        password,
      });
      if (result.ok) {
        reset();
      } else {
        setError(result.reason ?? "Those credentials didn't work. Please double-check them.");
      }
    } finally {
      setBusy(null);
    }
  }, [busy, serverUrl, username, password, onConnectCalDav, reset]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={close}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Close" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetWrap}
        pointerEvents="box-none"
      >
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          {view === 'picker' ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.title}>Connect a calendar</Text>
              <Text style={styles.subtitle}>
                Jimi reads and writes your real calendar. Choose where it lives.
              </Text>

              <ProviderRow
                label="Google Calendar"
                hint="Sign in with your Google account"
                busy={busy === 'google'}
                disabled={busy !== null}
                unavailable={!isEnabled('google')}
                onPress={() =>
                  isEnabled('google')
                    ? handleOAuth('google')
                    : showUnavailable('Google Calendar')
                }
              />
              <ProviderRow
                label="Outlook / Microsoft 365"
                hint="Sign in with your Microsoft account"
                busy={busy === 'microsoft'}
                disabled={busy !== null}
                unavailable={!isEnabled('microsoft')}
                onPress={() =>
                  isEnabled('microsoft')
                    ? handleOAuth('microsoft')
                    : showUnavailable('Outlook / Microsoft 365')
                }
              />
              <ProviderRow
                label="Apple iCloud / Other (CalDAV)"
                hint="Connect with a server URL and credentials"
                busy={false}
                disabled={busy !== null}
                unavailable={!isEnabled('caldav')}
                onPress={() => {
                  if (!isEnabled('caldav')) {
                    showUnavailable('Apple iCloud / CalDAV');
                    return;
                  }
                  setError(null);
                  setView('caldav');
                }}
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}
            </ScrollView>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.title}>Apple iCloud / CalDAV</Text>
              <Text style={styles.subtitle}>
                Enter your CalDAV server and credentials. For iCloud, use an
                app-specific password generated at appleid.apple.com (your normal
                password won't work).
              </Text>

              <Field
                label="Server URL"
                value={serverUrl}
                onChangeText={setServerUrl}
                placeholder="https://caldav.icloud.com"
                keyboardType="url"
                autoCapitalize="none"
                editable={!busy}
              />
              <Field
                label="Username / email"
                value={username}
                onChangeText={setUsername}
                placeholder="you@icloud.com"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!busy}
              />
              <Field
                label="App-specific password"
                value={password}
                onChangeText={setPassword}
                placeholder="xxxx-xxxx-xxxx-xxxx"
                autoCapitalize="none"
                secureTextEntry
                editable={!busy}
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <View style={styles.formActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Back to provider list"
                  disabled={busy !== null}
                  onPress={() => {
                    setError(null);
                    setView('picker');
                  }}
                  style={({ pressed }) => [
                    styles.button,
                    styles.ghost,
                    pressed && busy === null && styles.pressed,
                    busy !== null && styles.disabled,
                  ]}
                >
                  <Text style={[styles.buttonLabel, styles.ghostLabel]}>Back</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Connect CalDAV calendar"
                  disabled={busy !== null}
                  onPress={handleCalDav}
                  style={({ pressed }) => [
                    styles.button,
                    styles.primary,
                    styles.grow,
                    pressed && busy === null && styles.pressed,
                    busy !== null && styles.disabled,
                  ]}
                >
                  {busy === 'caldav' ? (
                    <ActivityIndicator size="small" color={colors.surface} />
                  ) : (
                    <Text style={[styles.buttonLabel, styles.primaryLabel]}>Connect</Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ProviderRow({
  label,
  hint,
  busy,
  disabled,
  unavailable = false,
  onPress,
}: {
  label: string;
  hint: string;
  busy: boolean;
  disabled: boolean;
  // Disabled by the deployment: rendered greyed and without a chevron. Still
  // tappable so the press handler can explain why it's unavailable.
  unavailable?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: unavailable }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && !disabled && !unavailable && styles.pressed,
        (unavailable || (disabled && !busy)) && styles.disabled,
      ]}
    >
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowHint}>{unavailable ? 'Temporarily unavailable' : hint}</Text>
      </View>
      {busy ? (
        <ActivityIndicator size="small" color={colors.accent} />
      ) : unavailable ? null : (
        <Text style={styles.chevron}>›</Text>
      )}
    </Pressable>
  );
}

function Field({
  label,
  ...input
}: {
  label: string;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        placeholderTextColor={colors.hint}
        accessibilityLabel={label}
        {...input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheetWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    maxHeight: '88%',
    width: '100%',
    alignSelf: 'center',
    maxWidth: 720,
    ...shadow.lg,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: typography.brandFamily,
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  rowText: { flex: 1 },
  rowLabel: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  rowHint: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    color: colors.hint,
    marginLeft: spacing.sm,
  },
  field: { marginBottom: spacing.md },
  fieldLabel: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.caption,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontFamily: typography.bodyFamily,
    fontSize: typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  error: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.caption,
    color: colors.offline,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  formActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  button: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md + 2,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  grow: { flex: 1 },
  primary: { backgroundColor: colors.accent },
  ghost: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.6 },
  buttonLabel: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.body,
    fontWeight: '600',
  },
  primaryLabel: { color: colors.surface },
  ghostLabel: { color: colors.text },
});
