import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  colors,
  radius,
  shadow,
  spacing,
  typography,
} from '../theme/styles';

interface Props {
  reason: string | null;
  retrying: boolean;
  onRetry: () => void;
}

export function OfflineBanner({ reason, retrying, onRetry }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Text style={styles.iconGlyph}>!</Text>
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>Jimi is offline</Text>
        <Text style={styles.body}>
          {reason ?? "We can't reach Jimi right now."} You can&apos;t send
          messages until the connection is restored.
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retry"
        accessibilityState={{ disabled: retrying }}
        onPress={retrying ? undefined : onRetry}
        style={({ pressed }) => [
          styles.retryButton,
          retrying && styles.retryDisabled,
          pressed && !retrying && styles.retryPressed,
        ]}
      >
        <Text style={styles.retryLabel}>
          {retrying ? 'Checking…' : 'Retry'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.offlineSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.offline,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    ...shadow.sm,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.offline,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconGlyph: {
    fontFamily: typography.brandFamily,
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
  },
  copy: { flex: 1 },
  title: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  body: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.caption,
    color: colors.textMuted,
    lineHeight: 18,
  },
  retryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.offline,
  },
  retryPressed: { backgroundColor: '#B91C1C' },
  retryDisabled: { backgroundColor: colors.hint },
  retryLabel: {
    fontFamily: typography.bodyFamily,
    color: '#FFFFFF',
    fontSize: typography.caption,
    fontWeight: '600',
  },
});
