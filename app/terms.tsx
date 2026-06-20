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

// Web-only page (native clients get terms from their app stores). If a deep
// link or refresh lands here on mobile, send the user back home.
const isWeb = Platform.OS === 'web';

const LAST_UPDATED = 'June 20, 2026';
const CONTACT_EMAIL = 'contact@jimi.julsql.fr';

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

export default function TermsScreen() {
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
              <Text style={styles.heroTitle}>Terms of Service</Text>
              <Text style={styles.heroSubtitle}>
                The rules for using Jimi. By using Jimi, you agree to them.
              </Text>
              <Text style={styles.heroMeta}>Last updated: {LAST_UPDATED}</Text>
            </View>

            <Section eyebrow="Agreement" title="Accepting these terms">
              <P>
                Jimi is a chatbot that helps you manage your schedule in
                natural language. By using Jimi you agree to these Terms. If
                you don&apos;t agree, please don&apos;t use the service.
              </P>
            </Section>

            <Section eyebrow="The service" title="What Jimi does">
              <Bullet>
                Jimi understands your messages and creates, edits, deletes or
                reads calendar events on your behalf.
              </Bullet>
              <Bullet>
                If you don&apos;t connect a calendar, Jimi keeps your events on
                our server. If you connect one (Google, Outlook/Microsoft or
                Apple/CalDAV), Jimi writes them straight to{' '}
                <Text style={styles.bold}>your own calendar</Text>.
              </Bullet>
              <Bullet>
                The service is offered free of charge and may change or be
                discontinued at any time.
              </Bullet>
            </Section>

            <Section eyebrow="Your account" title="Identity & responsibility">
              <P>
                Jimi doesn&apos;t require sign-up: you&apos;re identified by a
                random <Text style={styles.code}>userId</Text> stored in your
                browser. You are responsible for the content you send and the
                events you ask Jimi to manage.
              </P>
            </Section>

            <Section eyebrow="Connected calendars" title="What you authorise">
              <Bullet>
                When you connect a calendar, you authorise Jimi to read and
                write <Text style={styles.bold}>events</Text> on that calendar
                on your behalf — nothing else.
              </Bullet>
              <Bullet>
                You can disconnect at any time; doing so{' '}
                <Text style={styles.bold}>revokes</Text> Jimi&apos;s access.
              </Bullet>
              <Bullet>
                Destructive actions (deleting or editing events) always require
                your explicit confirmation before Jimi acts.
              </Bullet>
            </Section>

            <Section eyebrow="Acceptable use" title="What you must not do">
              <Bullet>Use Jimi for unlawful, harmful or abusive purposes.</Bullet>
              <Bullet>
                Attempt to disrupt, overload, reverse-engineer or gain
                unauthorised access to the service.
              </Bullet>
              <Bullet>
                Use Jimi to access or modify calendars or data that aren&apos;t
                yours.
              </Bullet>
            </Section>

            <Section eyebrow="Accuracy" title="Jimi can make mistakes">
              <P>
                Jimi relies on an AI model and can misunderstand or make errors.
                Always double-check important details — dates, times and
                deletions — before relying on them. You confirm destructive
                actions yourself, so you stay in control.
              </P>
            </Section>

            <Section eyebrow="Third parties" title="Services Jimi relies on">
              <P>
                Jimi sends your messages to <Text style={styles.bold}>Mistral
                AI</Text> to understand them, and — when you connect a calendar —
                acts on <Text style={styles.bold}>Google</Text>,{' '}
                <Text style={styles.bold}>Microsoft</Text> or your{' '}
                <Text style={styles.bold}>CalDAV</Text> provider. Your use of
                those calendars also remains subject to their own terms.
              </P>
            </Section>

            <Section eyebrow="No warranty" title="Provided “as is”">
              <P>
                Jimi is provided without warranties of any kind. To the extent
                permitted by law, we are not liable for any loss arising from
                your use of the service, including missed or incorrect calendar
                events. The service may have downtime or bugs.
              </P>
            </Section>

            <Section eyebrow="Ending" title="Termination">
              <P>
                You can stop using Jimi at any time and delete everything tied
                to your <Text style={styles.code}>userId</Text> (see the Privacy
                Policy / About page). We may suspend or limit access in case of
                abuse or to protect the service.
              </P>
            </Section>

            <Section eyebrow="Changes" title="Updates to these terms">
              <P>
                We&apos;ll bump the “Last updated” date above whenever these
                Terms change. Continuing to use Jimi after a change means you
                accept the updated Terms.
              </P>
            </Section>

            <Section eyebrow="Law" title="Governing law">
              <P>
                These Terms are governed by French law. See also our{' '}
                <Link href="/privacy" style={styles.link}>
                  Privacy Policy
                </Link>
                .
              </P>
            </Section>

            <Section eyebrow="Contact" title="Talk to us">
              <P>
                Questions about these Terms? Email <EmailLink />.
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
});
