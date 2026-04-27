import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from 'react-native';
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
import { fetchAgenda, AgendaEvent } from '../api/agendaService';
import { useUserId } from '../hooks/useUserId';

interface DateGroup {
  date: string;       // YYYY-MM-DD ('' for events with no date)
  label: string;      // human-friendly heading
  events: AgendaEvent[];
}

const TYPE_LABEL: Record<NonNullable<AgendaEvent['type']>, string> = {
  PRO: 'Professional',
  PERSONAL: 'Personal',
  UNDEFINED: 'Uncategorised',
};

const TYPE_COLOR: Record<NonNullable<AgendaEvent['type']>, string> = {
  PRO: '#3B82F6',         // blue
  PERSONAL: colors.accent, // brand orange
  UNDEFINED: '#9B9591',    // grey
};

export default function ScheduleScreen() {
  const userId = useUserId();
  const [events, setEvents] = useState<AgendaEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setError(null);
    try {
      const data = await fetchAgenda(userId);
      setEvents(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load events.');
      setEvents([]);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const groups = useMemo<DateGroup[]>(() => groupByDate(events ?? []), [events]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <AppBar />
        <View style={styles.contentWrap}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.heading}>Your schedule</Text>
              <Text style={styles.subheading}>
                {events === null
                  ? 'Loading…'
                  : events.length === 0
                    ? 'No events yet'
                    : `${events.length} event${events.length === 1 ? '' : 's'}`}
              </Text>
            </View>

            {events === null ? (
              <View style={styles.center}>
                <ActivityIndicator color={colors.accent} />
              </View>
            ) : events.length === 0 ? (
              <View style={styles.center}>
                <Text style={styles.emptyTitle}>Nothing scheduled</Text>
                <Text style={styles.emptyHint}>
                  {error
                    ? error
                    : 'Add events from the chat — they will appear here.'}
                </Text>
                <Pressable
                  onPress={onRefresh}
                  style={({ pressed }) => [
                    styles.retryBtn,
                    pressed && styles.retryBtnPressed,
                  ]}
                >
                  <Text style={styles.retryLabel}>Refresh</Text>
                </Pressable>
              </View>
            ) : (
              <FlatList
                data={groups}
                keyExtractor={(g) => g.date || 'no-date'}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={colors.accent}
                  />
                }
                renderItem={({ item }) => (
                  <View style={styles.group}>
                    <Text style={styles.groupHeader}>{item.label}</Text>
                    {item.events.map((e) => (
                      <EventCard key={e.id} event={e} />
                    ))}
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function EventCard({ event }: { event: AgendaEvent }) {
  const typeKey = event.type ?? 'UNDEFINED';
  const typeColor = TYPE_COLOR[typeKey];
  const typeLabel = TYPE_LABEL[typeKey];
  const time = formatTimeRange(event.beginTime, event.endTime);

  return (
    <View style={styles.card}>
      <View style={[styles.typeBar, { backgroundColor: typeColor }]} />
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{event.title || '(untitled)'}</Text>
        <View style={styles.cardMetaRow}>
          {time ? <Text style={styles.cardTime}>{time}</Text> : null}
          <View style={[styles.chip, { backgroundColor: hexWithAlpha(typeColor, 0.12) }]}>
            <View style={[styles.chipDot, { backgroundColor: typeColor }]} />
            <Text style={[styles.chipLabel, { color: typeColor }]}>{typeLabel}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function groupByDate(events: AgendaEvent[]): DateGroup[] {
  const buckets = new Map<string, AgendaEvent[]>();
  for (const e of events) {
    const key = e.date ?? '';
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(e);
  }
  const sortedKeys = [...buckets.keys()].sort();
  return sortedKeys.map((date) => ({
    date,
    label: formatDateHeading(date),
    events: buckets.get(date)!,
  }));
}

function formatDateHeading(date: string): string {
  if (!date) return 'Undated';
  // Compare using local date so "today" / "tomorrow" align with the user's TZ.
  const today = new Date();
  const todayStr = toIsoDate(today);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = toIsoDate(tomorrow);

  if (date === todayStr) return `Today · ${prettyDate(date)}`;
  if (date === tomorrowStr) return `Tomorrow · ${prettyDate(date)}`;
  return prettyDate(date);
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function prettyDate(date: string): string {
  // YYYY-MM-DD -> "Mon, Apr 28 2026"
  const [y, m, d] = date.split('-').map((s) => Number(s));
  if (!y || !m || !d) return date;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTimeRange(begin: string | null, end: string | null): string {
  const a = trimSeconds(begin);
  const b = trimSeconds(end);
  if (a && b) return `${a} – ${b}`;
  if (a) return a;
  if (b) return `until ${b}`;
  return '';
}

function trimSeconds(t: string | null): string {
  if (!t) return '';
  // Accepts "HH:mm" or "HH:mm:ss" — return "HH:mm".
  const m = t.match(/^(\d{1,2}):(\d{2})/);
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : t;
}

function hexWithAlpha(hex: string, alpha: number): string {
  // Quick #RRGGBB → rgba() helper for tinted chip backgrounds.
  const m = hex.match(/^#([0-9a-f]{6})$/i);
  if (!m) return hex;
  const v = parseInt(m[1], 16);
  const r = (v >> 16) & 0xff;
  const g = (v >> 8) & 0xff;
  const b = v & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },
  contentWrap: { flex: 1, alignItems: 'center' },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: layout.maxContentWidth,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  heading: {
    fontFamily: typography.brandFamily,
    fontSize: typography.headline,
    fontWeight: '600',
    color: colors.text,
  },
  subheading: {
    marginTop: 2,
    fontFamily: typography.bodyFamily,
    fontSize: typography.caption,
    color: colors.textMuted,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  group: { marginTop: spacing.lg },
  groupHeader: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.caption,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    ...shadow.sm,
  },
  typeBar: { width: 4 },
  cardBody: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  cardTitle: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: 6,
  },
  cardTime: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.caption,
    color: colors.textMuted,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    gap: 6,
  },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipLabel: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.micro,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontFamily: typography.brandFamily,
    fontSize: typography.title,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptyHint: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  retryBtnPressed: { backgroundColor: colors.accentDeep },
  retryLabel: {
    color: colors.surface,
    fontFamily: typography.bodyFamily,
    fontWeight: '600',
  },
});
