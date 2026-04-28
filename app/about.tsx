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

const isWeb = Platform.OS === 'web';

async function openUrl(url: string) {
  if (isWeb) {
    await Linking.openURL(url);
  } else {
    await WebBrowser.openBrowserAsync(url);
  }
}

interface ButtonProps {
  label: string;
  primary?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}

function ActionButton({ label, primary, disabled, onPress }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        btnStyles.base,
        primary ? btnStyles.primary : btnStyles.ghost,
        disabled && btnStyles.disabled,
        pressed && !disabled && (primary ? btnStyles.primaryPressed : btnStyles.ghostPressed),
      ]}
    >
      <Text
        style={[
          btnStyles.label,
          primary && btnStyles.labelPrimary,
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

  // On web, surface the store CTAs. On native, invite the user to the
  // web version. Apple Store still pending; Google Play is live.
  const ctas = isWeb ? (
    <View style={[styles.ctaRow, stack && styles.ctaColumn]}>
      <ActionButton label="Apple Store — coming soon" disabled />
      {stack ? <View style={{ height: spacing.sm }} /> : <View style={{ width: spacing.md }} />}
      <ActionButton
        label="Get it on Google Play"
        primary
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
        primary
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
  labelDisabled: { color: colors.textMuted, fontWeight: '500' },
});
