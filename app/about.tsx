import { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Image,
  useWindowDimensions,
  Linking,
  Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppBar } from '../components/AppBar';
import {
  colors,
  layout,
  radius,
  shadow,
  spacing,
  typography,
} from '../theme/styles';
import { useUserId, resetUserId } from '../hooks/useUserId';
import { deleteUserData } from '../api/userService';

const isWeb = Platform.OS === 'web';

async function openUrl(url: string) {
  if (isWeb) {
    await Linking.openURL(url);
  } else {
    await WebBrowser.openBrowserAsync(url);
  }
}

type ButtonVariant = 'primary' | 'ghost' | 'danger';

interface ButtonProps {
  label: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  onPress?: () => void;
}

function ActionButton({ label, variant = 'ghost', disabled, onPress }: ButtonProps) {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        btnStyles.base,
        isPrimary && btnStyles.primary,
        isDanger && btnStyles.danger,
        !isPrimary && !isDanger && btnStyles.ghost,
        disabled && btnStyles.disabled,
        pressed && !disabled && isPrimary && btnStyles.primaryPressed,
        pressed && !disabled && isDanger && btnStyles.dangerPressed,
        pressed && !disabled && !isPrimary && !isDanger && btnStyles.ghostPressed,
      ]}
    >
      <Text
        style={[
          btnStyles.label,
          isPrimary && btnStyles.labelPrimary,
          isDanger && btnStyles.labelDanger,
          disabled && btnStyles.labelDisabled,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function AboutScreen() {
  const { width } = useWindowDimensions();
  const stack = width < 480;
  const userId = useUserId();
  const [deleting, setDeleting] = useState(false);

  const runDeletion = async () => {
    if (!userId || deleting) return;
    setDeleting(true);
    try {
      await deleteUserData(userId);
      await resetUserId();
      if (isWeb) {
        window.alert('Your data has been deleted.');
      } else {
        Alert.alert('Done', 'Your data has been deleted.');
      }
    } catch {
      const msg = 'Could not delete your data. Please try again.';
      if (isWeb) window.alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeletePress = () => {
    if (!userId || deleting) return;
    const title = 'Delete all your data?';
    const message =
      'This will permanently remove every event and conversation tied to your account. This cannot be undone.';
    if (isWeb) {
      if (window.confirm(`${title}\n\n${message}`)) {
        void runDeletion();
      }
    } else {
      Alert.alert(title, message, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => void runDeletion() },
      ]);
    }
  };

  // On web, surface the store CTAs. On native, invite the user to the
  // web version. Apple Store still pending; Google Play is live.
  const ctas = isWeb ? (
    <View style={[styles.ctaRow, stack && styles.ctaColumn]}>
      <ActionButton label="Apple Store — coming soon" disabled />
      {stack ? <View style={{ height: spacing.sm }} /> : <View style={{ width: spacing.md }} />}
      <ActionButton
        label="Get it on Google Play"
        variant="primary"
        onPress={() =>
          openUrl(
            'https://play.google.com/store/apps/details?id=fr.tsp.jimithechatbot',
          )
        }
      />
    </View>
  ) : (
    <View style={styles.ctaCenter}>
      <ActionButton
        label="Visit the web version"
        variant="primary"
        onPress={() => openUrl('https://jimi.julsql.fr/')}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <AppBar />
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentWrap}>
            <View style={styles.hero}>
              <View style={styles.logoCircle}>
                <Image
                  source={require('../assets/images/logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.heroTitle}>Welcome to Jimi</Text>
              <Text style={styles.heroSubtitle}>
                Your friendly chatbot for managing time and calendar.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardEyebrow}>About</Text>
              <Text style={styles.cardBody}>
                I&apos;m here to help you to manage your agenda — book
                meetings, set reminders, and keep track of what&apos;s next.
              </Text>
            </View>

            <View style={styles.ctaSection}>{ctas}</View>

            <View style={styles.dangerSection}>
              <Text style={styles.dangerTitle}>Your data</Text>
              <Text style={styles.dangerBody}>
                Permanently delete every event and conversation tied to
                your account. This cannot be undone.
              </Text>
              <View style={styles.dangerButtonRow}>
                <ActionButton
                  label={deleting ? 'Deleting…' : 'Delete my data'}
                  variant="danger"
                  disabled={!userId || deleting}
                  onPress={handleDeletePress}
                />
              </View>
            </View>

            {/* Privacy is a web-only concern — the mobile apps surface
                privacy info via their respective stores. */}
            {isWeb ? (
              <View style={styles.footer}>
                <Link href="/privacy" style={styles.footerLink}>
                  Privacy Policy
                </Link>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const HERO_LOGO = 88;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, alignItems: 'center' },
  contentWrap: { width: '100%', maxWidth: layout.maxContentWidth },
  hero: { alignItems: 'center', paddingVertical: spacing.xl },
  logoCircle: {
    width: HERO_LOGO,
    height: HERO_LOGO,
    borderRadius: HERO_LOGO / 2,
    backgroundColor: colors.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadow.md,
  },
  logo: { width: HERO_LOGO - 16, height: HERO_LOGO - 16 },
  heroTitle: {
    fontFamily: typography.brandFamily,
    fontSize: typography.display,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 380,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.md,
    ...shadow.sm,
  },
  cardEyebrow: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.caption,
    fontWeight: '600',
    color: colors.accent,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  cardBody: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.body,
    color: colors.text,
    lineHeight: 24,
  },
  ctaSection: { marginTop: spacing.xl, alignItems: 'center' },
  dangerSection: {
    marginTop: spacing.xl,
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.offlineSoft,
    backgroundColor: colors.surface,
  },
  dangerTitle: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.caption,
    fontWeight: '600',
    color: colors.offline,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  dangerBody: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.body,
    color: colors.text,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  dangerButtonRow: { alignItems: 'center' },
  footer: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  footerLink: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.caption,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
  ctaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaColumn: { flexDirection: 'column' },
  ctaCenter: { width: '100%', alignItems: 'center' },
});

const btnStyles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    minWidth: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.accent,
    ...shadow.md,
  },
  primaryPressed: { backgroundColor: colors.accentDeep },
  ghost: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghostPressed: { backgroundColor: colors.surfaceMuted },
  danger: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.offline,
  },
  dangerPressed: { backgroundColor: colors.offlineSoft },
  disabled: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderWidth: 1,
  },
  label: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  labelPrimary: { color: colors.surface },
  labelDanger: { color: colors.offline },
  labelDisabled: { color: colors.textMuted, fontWeight: '500' },
});
