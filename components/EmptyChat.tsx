import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { colors, radius, shadow, spacing, typography } from '../theme/styles';

const SUGGESTIONS = [
  "What's on my schedule today?",
  'Add a meeting tomorrow at 3pm',
  'Remind me to call Alex',
];

interface Props {
  onSuggestionPress?: (text: string) => void;
  disabled?: boolean;
}

export function EmptyChat({ onSuggestionPress, disabled }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.logoCircle}>
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.headline}>Hi, I&apos;m Jimi</Text>
      <Text style={styles.subtitle}>
        Ask me anything about your agenda — meetings, reminders, or whatever
        you need to keep on top of.
      </Text>

      <View style={[styles.suggestionList, disabled && styles.suggestionDisabled]}>
        {SUGGESTIONS.map((s) => (
          <Pressable
            key={s}
            accessibilityRole="button"
            accessibilityState={{ disabled: !!disabled }}
            onPress={disabled ? undefined : () => onSuggestionPress?.(s)}
            style={({ pressed }) => [
              styles.chip,
              pressed && !disabled && styles.chipPressed,
            ]}
          >
            <Text style={styles.chipText}>{s}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const LOGO_SIZE = 96;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  logoCircle: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
    backgroundColor: colors.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadow.md,
  },
  logo: { width: LOGO_SIZE - 16, height: LOGO_SIZE - 16 },
  headline: {
    fontFamily: typography.brandFamily,
    fontSize: typography.display,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 360,
    lineHeight: 22,
  },
  suggestionList: {
    marginTop: spacing.xl,
    gap: spacing.sm,
    width: '100%',
    maxWidth: 360,
  },
  suggestionDisabled: { opacity: 0.45 },
  chip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  chipPressed: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  chipText: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.body - 1,
    color: colors.text,
    textAlign: 'center',
  },
});
