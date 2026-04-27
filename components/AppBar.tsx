import { useEffect, useRef } from 'react';
import {
  Pressable,
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import {
  colors,
  layout,
  radius,
  shadow,
  spacing,
  typography,
} from '../theme/styles';
import { useApiHealth, type ApiStatus } from '../contexts/ApiHealthContext';

const LOGO_SIZE = 40;

const STATUS_LABEL: Record<ApiStatus, string> = {
  checking: 'Connecting…',
  online: 'Online',
  offline: 'Offline',
};

const STATUS_COLOR: Record<ApiStatus, string> = {
  checking: colors.checking,
  online: colors.online,
  offline: colors.offline,
};

function StatusDot({ status }: { status: ApiStatus }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (status !== 'checking') {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [status, pulse]);

  const opacity = status === 'checking' ? pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  }) : 1;

  return (
    <Animated.View
      style={[styles.dot, { backgroundColor: STATUS_COLOR[status], opacity }]}
    />
  );
}

export function AppBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useApiHealth();

  const onAbout = pathname === '/about';
  const onSchedule = pathname === '/schedule';
  const handleInfoPress = () => {
    if (onAbout) {
      // Toggle off: go back to wherever we came from (the chat). Fall back
      // to /home when there's no history (e.g. direct refresh on /about).
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/home');
      }
    } else {
      router.push('/about');
    }
  };
  const handleSchedulePress = () => {
    if (onSchedule) {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/home');
      }
    } else {
      router.push('/schedule');
    }
  };

  return (
    <View style={styles.bar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Home"
        onPress={() => router.replace('/home')}
        style={({ pressed }) => [styles.brand, pressed && styles.pressed]}
      >
        <View style={styles.logoCircle}>
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <View style={styles.brandText}>
          <Text style={styles.title}>Jimi</Text>
          <View style={styles.statusRow}>
            <StatusDot status={status} />
            <Text style={styles.subtitle}>{STATUS_LABEL[status]}</Text>
          </View>
        </View>
      </Pressable>

      <View style={styles.spacer} />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={onSchedule ? 'Back' : 'Schedule'}
        accessibilityState={{ selected: onSchedule }}
        onPress={handleSchedulePress}
        style={({ pressed }) => [styles.iconButton, pressed && styles.iconPressed]}
      >
        <View style={[styles.calendarIcon, onSchedule && styles.calendarIconActive]}>
          <View style={[styles.calendarHeader, onSchedule && styles.calendarHeaderActive]} />
          <View style={styles.calendarDotsRow}>
            <View style={[styles.calendarDot, onSchedule && styles.calendarDotActive]} />
            <View style={[styles.calendarDot, onSchedule && styles.calendarDotActive]} />
          </View>
          <View style={styles.calendarDotsRow}>
            <View style={[styles.calendarDot, onSchedule && styles.calendarDotActive]} />
            <View style={[styles.calendarDot, onSchedule && styles.calendarDotActive]} />
          </View>
        </View>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={onAbout ? 'Back' : 'About'}
        accessibilityState={{ selected: onAbout }}
        onPress={handleInfoPress}
        style={({ pressed }) => [styles.iconButton, pressed && styles.iconPressed]}
      >
        <View style={[styles.infoIconCircle, onAbout && styles.infoIconActive]}>
          <Text style={[styles.infoGlyph, onAbout && styles.infoGlyphActive]}>
            i
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    minHeight: layout.toolbarHeight,
    ...shadow.sm,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.lg,
  },
  pressed: { opacity: 0.7 },
  logoCircle: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
    backgroundColor: colors.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: LOGO_SIZE - 4,
    height: LOGO_SIZE - 4,
  },
  brandText: { justifyContent: 'center' },
  title: {
    fontFamily: typography.brandFamily,
    fontSize: typography.title,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 22,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 1,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  subtitle: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.caption,
    color: colors.textMuted,
  },
  spacer: { flex: 1 },
  iconButton: {
    padding: spacing.xs,
    borderRadius: radius.pill,
  },
  iconPressed: { backgroundColor: colors.surfaceMuted },
  infoIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoGlyph: {
    fontFamily: typography.brandFamily,
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  infoIconActive: {
    backgroundColor: colors.accent,
  },
  infoGlyphActive: {
    color: colors.surface,
  },
  calendarIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.accent,
    paddingTop: 7,
    paddingHorizontal: 5,
    backgroundColor: 'transparent',
  },
  calendarIconActive: {
    backgroundColor: colors.accent,
  },
  calendarHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: colors.accent,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  calendarHeaderActive: {
    backgroundColor: colors.surface,
  },
  calendarDotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  calendarDot: {
    width: 4,
    height: 4,
    borderRadius: 1,
    backgroundColor: colors.accent,
  },
  calendarDotActive: {
    backgroundColor: colors.surface,
  },
});
