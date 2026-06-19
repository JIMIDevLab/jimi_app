import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme/styles';

// Landing page for the web OAuth return (the server redirects the auth popup
// here after linking a calendar). The auth session usually detects this URL and
// closes the popup automatically; this screen is the graceful fallback if the
// popup fully loads it.
export default function Connected() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calendar connected ✅</Text>
      <Text style={styles.subtitle}>You can close this tab and return to Jimi.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  title: {
    fontFamily: typography.brandFamily,
    fontSize: typography.title,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
