import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
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

// Web-only page. Native clients (iOS / Android) shouldn't surface a privacy
// policy from inside the app — they get one from their respective stores.
// If a deep link or refresh lands here on mobile, send the user back home.
const isWeb = Platform.OS === 'web';

const LAST_UPDATED = 'April 29, 2026';
const CONTACT_EMAIL = 'julsql1@gmail.com';

interface SectionProps {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}

function Section({ eyebrow, title, children }: SectionProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <Text style={styles.paragraph}>{children}</Text>;
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.bullet}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

export default function PrivacyScreen() {
  if (!isWeb) {
    return <Redirect href="/home" />;
  }

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
              <Text style={styles.heroTitle}>Privacy Policy</Text>
              <Text style={styles.heroSubtitle}>
                What Jimi collects, why, and what control you have over it.
              </Text>
              <Text style={styles.heroMeta}>Last updated: {LAST_UPDATED}</Text>
            </View>

            <Section eyebrow="What we collect" title="Data tied to your use">
              <Bullet>
                A randomly generated <Text style={styles.code}>userId</Text>{' '}
                stored in your browser&apos;s local storage. It lets us tie
                your messages and calendar entries together across reloads.
                It is not linked to your name, email or IP address.
              </Bullet>
              <Bullet>
                The messages you send to Jimi, and Jimi&apos;s replies.
              </Bullet>
              <Bullet>
                The calendar events you create through Jimi (date, time,
                type, title).
              </Bullet>
              <Bullet>
                Standard server logs (IP address, user agent, request path)
                kept for security and debugging — purged after 30 days.
              </Bullet>
            </Section>

            <Section eyebrow="How it&apos;s used" title="Processing">
              <P>
                Your messages are sent to{' '}
                <Text style={styles.bold}>Mistral AI</Text> — a French
                company headquartered in Paris — so Jimi can understand
                natural language and update your calendar. Mistral runs
                the model that generates Jimi&apos;s replies; requests
                are processed within the European Union.
              </P>
              <P>
                Per Mistral&apos;s API terms, your prompts and Jimi&apos;s
                replies are not retained by Mistral and are not used to
                train their models.
              </P>
              <P>
                Calendar entries themselves are stored on our own server
                (Spring Boot application + MariaDB database) hosted in
                the European Union, never on Mistral&apos;s side.
              </P>
            </Section>

            <Section eyebrow="Storage" title="Where the data lives">
              <Bullet>
                <Text style={styles.code}>userId</Text>: in your browser
                only (local storage). Clearing your browser data deletes it.
              </Bullet>
              <Bullet>
                Messages and events: on our server, indexed by{' '}
                <Text style={styles.code}>userId</Text>.
              </Bullet>
              <Bullet>
                We don&apos;t use cookies for tracking. The only persisted
                client-side value is the <Text style={styles.code}>userId</Text>.
              </Bullet>
            </Section>

            <Section eyebrow="Retention" title="How long we keep it">
              <P>
                Messages and calendar events are kept as long as your
                <Text style={styles.code}> userId</Text> remains active. If
                you don&apos;t use Jimi for 12 months, we automatically
                delete the data tied to your <Text style={styles.code}>userId</Text>.
              </P>
              <P>
                You can delete everything at any time by emailing the
                address below — see &quot;Your rights&quot;.
              </P>
            </Section>

            <Section eyebrow="Your rights (GDPR)" title="What you can ask for">
              <Bullet>
                <Text style={styles.bold}>Access</Text> — get a copy of the
                data we hold about your <Text style={styles.code}>userId</Text>.
              </Bullet>
              <Bullet>
                <Text style={styles.bold}>Rectification</Text> — ask us to
                correct inaccurate information.
              </Bullet>
              <Bullet>
                <Text style={styles.bold}>Deletion</Text> — ask us to wipe
                everything tied to your <Text style={styles.code}>userId</Text>.
              </Bullet>
              <Bullet>
                <Text style={styles.bold}>Portability</Text> — receive your
                data in a machine-readable JSON format.
              </Bullet>
              <Bullet>
                <Text style={styles.bold}>Objection</Text> — opt out of any
                future processing.
              </Bullet>
              <P>
                To exercise any of these, find your <Text style={styles.code}>userId</Text>{' '}
                in the About page footer and email us at{' '}
                <Text style={styles.bold}>{CONTACT_EMAIL}</Text>. We respond
                within 30 days.
              </P>
            </Section>

            <Section eyebrow="Children" title="Age limit">
              <P>
                Jimi is not directed at children under 16. If you believe a
                child has used Jimi, contact us so we can remove their data.
              </P>
            </Section>

            <Section eyebrow="Changes" title="Updates to this policy">
              <P>
                We&apos;ll bump the &quot;Last updated&quot; date at the top
                of this page whenever the policy changes. Material changes
                will also be announced inside the app.
              </P>
            </Section>

            <Section eyebrow="Contact" title="Talk to us">
              <P>
                Email <Text style={styles.bold}>{CONTACT_EMAIL}</Text>. We
                read everything that comes in.
              </P>
            </Section>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, alignItems: 'center' },
  contentWrap: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    paddingBottom: spacing.xxl,
  },
  hero: { paddingVertical: spacing.xl },
  heroTitle: {
    fontFamily: typography.brandFamily,
    fontSize: typography.display,
    fontWeight: '600',
    color: colors.text,
  },
  heroSubtitle: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.body,
    color: colors.textMuted,
    marginTop: spacing.sm,
    lineHeight: 22,
    maxWidth: 560,
  },
  heroMeta: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.caption,
    color: colors.hint,
    marginTop: spacing.md,
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
  eyebrow: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.caption,
    fontWeight: '600',
    color: colors.accent,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  cardTitle: {
    fontFamily: typography.brandFamily,
    fontSize: typography.headline,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  cardBody: { gap: spacing.sm },
  paragraph: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.body,
    color: colors.text,
    lineHeight: 24,
  },
  bullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  bulletDot: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.body,
    color: colors.accent,
    lineHeight: 24,
    marginTop: 1,
  },
  bulletText: {
    flex: 1,
    fontFamily: typography.bodyFamily,
    fontSize: typography.body,
    color: colors.text,
    lineHeight: 24,
  },
  bold: { fontWeight: '600' },
  code: {
    fontFamily: Platform.select({
      web: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
    fontSize: typography.body - 1,
    color: colors.accentDeep,
  },
});
