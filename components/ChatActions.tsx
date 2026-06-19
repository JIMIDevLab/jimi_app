import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/styles';
import { MessageAction } from '../models/Message';

interface Props {
  action: MessageAction;
  onConnect: () => Promise<void> | void;
  onConfirm: (confirmed: boolean) => Promise<void> | void;
  onOpenEvent: (url: string) => Promise<void> | void;
}

// Renders the inline buttons attached to a bot message. Each button shows a
// spinner while its async handler runs and disables itself so an action can't
// be fired twice (important for the confirm/delete path).
export function ChatActions({ action, onConnect, onConfirm, onOpenEvent }: Props) {
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<void> | void) {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  }

  if (action.kind === 'connect') {
    return (
      <View style={styles.wrap}>
        <Button
          label="Connect Google Calendar"
          variant="primary"
          busy={busy}
          onPress={() => run(() => onConnect())}
        />
      </View>
    );
  }

  if (action.kind === 'confirm') {
    return (
      <View style={[styles.wrap, styles.row]}>
        <Button
          label="Confirm"
          variant="primary"
          busy={busy}
          onPress={() => run(() => onConfirm(true))}
        />
        <Button
          label="Cancel"
          variant="ghost"
          busy={busy}
          onPress={() => run(() => onConfirm(false))}
        />
      </View>
    );
  }

  if (action.kind === 'openEvent' && action.eventUrl) {
    const url = action.eventUrl;
    return (
      <View style={styles.wrap}>
        <Button
          label="Open in calendar"
          variant="ghost"
          busy={busy}
          onPress={() => run(() => onOpenEvent(url))}
        />
      </View>
    );
  }

  return null;
}

function Button({
  label,
  variant,
  busy,
  onPress,
}: {
  label: string;
  variant: 'primary' | 'ghost';
  busy: boolean;
  onPress: () => void;
}) {
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        primary ? styles.primary : styles.ghost,
        pressed && !busy && styles.pressed,
        busy && styles.disabled,
      ]}
    >
      {busy && primary ? (
        <ActivityIndicator size="small" color={colors.surface} />
      ) : (
        <Text style={[styles.label, primary ? styles.labelPrimary : styles.labelGhost]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
    maxWidth: '85%',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md + 2,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  primary: {
    backgroundColor: colors.accent,
  },
  ghost: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.6 },
  label: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.body,
    fontWeight: '600',
  },
  labelPrimary: { color: colors.surface },
  labelGhost: { color: colors.text },
});
