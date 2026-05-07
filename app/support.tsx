import { Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, Redirect } from 'expo-router';
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

// Web-only page. Native clients open this in an in-app browser when the
// user taps "Support" in About, or land here via the App Store support URL.
const isWeb = Platform.OS === 'web';

const LAST_UPDATED = 'May 8, 2026';
const CONTACT_EMAIL = 'contact@jimi.julsql.fr';
const RESPONSE_WINDOW = 'within 2 business days';

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

function EmailLink() {
  return (
    <Text
      style={styles.link}
      onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)}
      accessibilityRole="link"
    >
      {CONTACT_EMAIL}
    </Text>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.bullet}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

interface FaqProps {
  question: string;
  children: React.ReactNode;
}

function Faq({ question, children }: FaqProps) {
  return (
    <View style={styles.faqItem}>
      <Text style={styles.faqQuestion}>{question}</Text>
      <View style={styles.faqAnswer}>{children}</View>
    </View>
  );
}

export default function SupportScreen() {
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
              <Text style={styles.heroTitle}>Support</Text>
              <Text style={styles.heroSubtitle}>
                Need a hand with Jimi? You&apos;re in the right place. Browse
                the FAQ below or reach out by email — we read every message.
              </Text>
              <Text style={styles.heroMeta}>Last updated: {LAST_UPDATED}</Text>
            </View>

            <Section eyebrow="Contact" title="Get in touch">
              <P>
                The fastest way to reach us is by email at <EmailLink />.
                We typically reply {RESPONSE_WINDOW}.
              </P>
              <P>
                When you write to us, please include:
              </P>
              <Bullet>A short description of what happened.</Bullet>
              <Bullet>
                The platform you&apos;re using (iOS, Android or Web) and your
                app version.
              </Bullet>
              <Bullet>
                If possible, your <Text style={styles.code}>userId</Text> —
                you&apos;ll find it in the About page footer. It helps us
                locate your data.
              </Bullet>
            </Section>

            <Section eyebrow="Getting started" title="How Jimi works">
              <P>
                Jimi is a chatbot that manages your calendar through natural
                language. Just tell it what you want to do — for example:
              </P>
              <Bullet>
                <Text style={styles.italic}>
                  &quot;Book a dentist appointment next Tuesday at 3pm.&quot;
                </Text>
              </Bullet>
              <Bullet>
                <Text style={styles.italic}>
                  &quot;What&apos;s on my schedule tomorrow?&quot;
                </Text>
              </Bullet>
              <Bullet>
                <Text style={styles.italic}>
                  &quot;Cancel my meeting Friday morning.&quot;
                </Text>
              </Bullet>
              <P>
                If Jimi needs more info (e.g. duration, type of event), it
                will ask follow-up questions in the same conversation.
              </P>
              <P>
                You can view all your saved events at any time on the{' '}
                <Text style={styles.bold}>Calendar</Text> page (calendar icon
                in the top bar).
              </P>
            </Section>

            <Section eyebrow="FAQ" title="Frequently asked questions">
              <Faq question="Why is the app showing &quot;Offline&quot;?">
                <P>
                  The app probes the backend at startup. If the connection
                  fails, you&apos;ll see a red banner with a{' '}
                  <Text style={styles.bold}>Retry</Text> button. Tap it to
                  re-check. If the issue persists, the server may be
                  temporarily down — please try again in a few minutes.
                </P>
              </Faq>

              <Faq question="My events disappeared after reinstalling the app.">
                <P>
                  Your <Text style={styles.code}>userId</Text> is stored
                  locally on your device. Reinstalling the app generates a
                  new one, so previous events are no longer linked to your
                  account. Email us with both your old and new{' '}
                  <Text style={styles.code}>userId</Text> values and we can
                  help recover the data.
                </P>
              </Faq>

              <Faq question="How do I delete my data?">
                <P>
                  Open the <Text style={styles.bold}>About</Text> page and
                  tap <Text style={styles.bold}>Delete my data</Text>. This
                  permanently removes every event and conversation tied to
                  your account. You can also email us to request deletion.
                </P>
              </Faq>

              <Faq question="Jimi gave me a wrong reply or made up an event.">
                <P>
                  Jimi uses a language model and can occasionally
                  misinterpret a request. The{' '}
                  <Text style={styles.bold}>Calendar</Text> page reads
                  straight from our database, so it always shows the real
                  state of your schedule. If something looks wrong, check
                  the Calendar page first, then let us know what you asked
                  versus what was saved.
                </P>
              </Faq>

              <Faq question="Is my data shared with third parties?">
                <P>
                  Your messages are processed by{' '}
                  <Text style={styles.bold}>Mistral AI</Text> (France) so
                  Jimi can understand them. Mistral does not retain your
                  prompts and does not use them to train its models.
                  Calendar entries are stored only on our own server in the
                  EU. See the <Text style={styles.bold}>Privacy Policy</Text>{' '}
                  for full details.
                </P>
              </Faq>

              <Faq question="Can I use Jimi on multiple devices?">
                <P>
                  Not yet — each device generates its own{' '}
                  <Text style={styles.code}>userId</Text>, so events created
                  on one device don&apos;t appear on another. A multi-device
                  account system is on the roadmap.
                </P>
              </Faq>

              <Faq question="The app crashes or freezes.">
                <P>
                  Try closing and reopening the app. If the problem
                  continues, please email us with your platform (iOS /
                  Android / Web), app version, and a short description of
                  what you were doing. Screenshots help a lot.
                </P>
              </Faq>
            </Section>

            <Section eyebrow="Reporting" title="Bugs &amp; feature requests">
              <P>
                Found a bug, or have an idea to make Jimi better? Send it
                our way at <EmailLink />. We track every report and reply
                personally.
              </P>
            </Section>

            <Section eyebrow="More" title="Other resources">
              <Bullet>
                <Link href="/privacy" style={styles.link}>
                  Privacy Policy
                </Link>
                <Text> — what we collect and why.</Text>
              </Bullet>
              <Bullet>
                <Link href="/about" style={styles.link}>
                  About
                </Link>
                <Text> — app description, store links and your user ID.</Text>
              </Bullet>
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
  italic: { fontStyle: 'italic' },
  link: {
    fontWeight: '600',
    color: colors.accent,
    textDecorationLine: 'underline',
  },
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
  faqItem: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  faqQuestion: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  faqAnswer: { gap: spacing.sm },
});
