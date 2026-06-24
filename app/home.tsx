import { useCallback, useEffect, useRef, useState } from 'react';
import { useUserId } from '../hooks/useUserId';
import {
  View,
  TextInput,
  Pressable,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ListRenderItemInfo,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { AppBar } from '../components/AppBar';
import { ChatBubble } from '../components/ChatBubble';
import { TypingIndicator } from '../components/TypingIndicator';
import { EmptyChat } from '../components/EmptyChat';
import { OfflineBanner } from '../components/OfflineBanner';
import {
  colors,
  layout,
  radius,
  shadow,
  spacing,
  typography,
} from '../theme/styles';
import { ChatActions } from '../components/ChatActions';
import { ConnectCalendarSheet } from '../components/ConnectCalendarSheet';
import { sendMessage, confirmAction } from '../api/apiServicePost';
import {
  connectOAuth,
  connectCalDav,
  isCalendarConnected,
  fetchEnabledProviders,
  type CalDavCredentials,
  type CalendarProvider,
  type OAuthProvider,
} from '../api/calendarConnection';
import { openEvent } from '../api/nativeCalendar';
import { ChatApiResponse, MessageModel } from '../models/Message';
import { useApiHealth } from '../contexts/ApiHealthContext';

// Turns a server reply into a bot message, attaching the right inline action:
// connect a calendar, confirm an edit/delete, or open the affected event.
function toBotMessage(answer: ChatApiResponse, retryMessage?: string): MessageModel {
  let action: MessageModel['action'];
  if (answer.status === 'NEEDS_CONNECTION') {
    action = { kind: 'connect', retryMessage };
  } else if (answer.status === 'AWAITING_CONFIRMATION' && answer.conversationId) {
    action = { kind: 'confirm', conversationId: answer.conversationId };
  } else if (answer.eventUrl) {
    action = { kind: 'openEvent', eventUrl: answer.eventUrl };
  }
  return { content: answer.message, sender: 'Chatbot', timestamp: Date.now(), action };
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<MessageModel[]>([]);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  const conversationIdRef = useRef<string | null>(null);
  const listRef = useRef<FlatList<MessageModel>>(null);
  // When a 'connect' action is tapped we open the provider picker. `index` is the
  // message whose connect button was tapped (so success can consume it); it's
  // absent when the user connects proactively from the banner.
  const [connectSheet, setConnectSheet] = useState<{
    index?: number;
    retryMessage?: string;
  } | null>(null);
  // null = unknown (not checked yet); true/false once /connections is read.
  const [calendarConnected, setCalendarConnected] = useState<boolean | null>(null);
  // Which providers the server currently offers (deploy-time toggles). null
  // until /config is read; the picker hides any provider absent from this list.
  const [enabledProviders, setEnabledProviders] = useState<CalendarProvider[] | null>(null);
  const userId = useUserId();

  const { status, errorReason, recheck, reportFailure } = useApiHealth();
  const online = status === 'online';
  const checking = status === 'checking';
  const ready = online && userId !== null;

  // Check whether a calendar is connected, to offer a proactive "connect" CTA.
  useEffect(() => {
    if (!userId || !online) return;
    let cancelled = false;
    isCalendarConnected(userId).then((c) => {
      if (!cancelled) setCalendarConnected(c);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, online]);

  // Read which calendar providers the deployment offers, so disabled ones are
  // hidden from the picker. Refreshed whenever the API comes back online.
  useEffect(() => {
    if (!online) return;
    let cancelled = false;
    fetchEnabledProviders().then((providers) => {
      if (!cancelled) setEnabledProviders(providers);
    });
    return () => {
      cancelled = true;
    };
  }, [online]);

  const submit = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || pending || !online || !userId) return;

      const userMessage: MessageModel = {
        content: trimmed,
        sender: 'User',
        timestamp: Date.now(),
      };
      const nextHistory = [...messages, userMessage];
      setMessages(nextHistory);
      setDraft('');
      setPending(true);

      try {
        const answer = await sendMessage(
          trimmed,
          userId,
          conversationIdRef.current,
        );
        if (!answer.message || answer.message.trim() === '') {
          // 200 with empty body — treat as LLM hiccup, flip to offline.
          reportFailure("Jimi reached the API but the assistant isn't replying.");
          return;
        }
        // Server keeps the draft alive while status is AWAITING_INFO; clear
        // it once the conversation completes so the next message starts fresh.
        // A pending confirmation carries its conversationId inside the message
        // action instead, so typing a new message starts a fresh extraction.
        conversationIdRef.current =
          answer.status === 'AWAITING_INFO' ? answer.conversationId : null;
        setMessages((prev) => [...prev, toBotMessage(answer, trimmed)]);
      } catch (err) {
        reportFailure(
          err instanceof Error ? err.message : 'Something went wrong.',
        );
      } finally {
        setPending(false);
      }
    },
    [messages, pending, online, userId, reportFailure],
  );

  // Removes the inline buttons from a message once its action has been taken,
  // so a confirm/connect can't be fired twice.
  const consumeAction = useCallback((index: number) => {
    setMessages((prev) =>
      prev.map((m, i) => (i === index ? { ...m, action: undefined } : m)),
    );
  }, []);

  const appendBot = useCallback((content: string) => {
    setMessages((prev) => [
      ...prev,
      { content, sender: 'Chatbot', timestamp: Date.now() },
    ]);
  }, []);

  // Tapping the inline 'Connect a calendar' button no longer runs Google
  // directly — it opens the provider picker. The picker reports success and we
  // finish the flow here (consume the action, confirm, replay the message).
  const openConnectSheet = useCallback((index?: number, retryMessage?: string) => {
    setConnectSheet({ index, retryMessage });
  }, []);

  const finishConnect = useCallback(() => {
    if (connectSheet) {
      if (connectSheet.index !== undefined) consumeAction(connectSheet.index);
      appendBot('Your calendar is connected. \u{1F389}');
      if (connectSheet.retryMessage) submit(connectSheet.retryMessage);
    }
    setCalendarConnected(true);
    setConnectSheet(null);
  }, [connectSheet, consumeAction, appendBot, submit]);

  // OAuth providers (Google, Microsoft): on success we close the sheet and run
  // finishConnect. On failure we return false so the sheet shows its own retry
  // hint and stays open.
  const handleConnectOAuth = useCallback(
    async (provider: OAuthProvider): Promise<boolean> => {
      if (!userId) return false;
      const ok = await connectOAuth(userId, provider);
      if (ok) finishConnect();
      return ok;
    },
    [userId, finishConnect],
  );

  const handleConnectCalDav = useCallback(
    async (credentials: CalDavCredentials) => {
      if (!userId) return { ok: false, reason: 'Not signed in yet.' };
      const result = await connectCalDav(userId, credentials);
      if (result.ok) finishConnect();
      return result;
    },
    [userId, finishConnect],
  );

  const handleConfirm = useCallback(
    async (index: number, conversationId: string, confirmed: boolean) => {
      if (!userId) return;
      consumeAction(index);
      setPending(true);
      try {
        const answer = await confirmAction(userId, conversationId, confirmed);
        setMessages((prev) => [...prev, toBotMessage(answer)]);
      } catch (err) {
        reportFailure(
          err instanceof Error ? err.message : 'Something went wrong.',
        );
      } finally {
        setPending(false);
      }
    },
    [userId, consumeAction, reportFailure],
  );

  function renderItem({ item, index }: ListRenderItemInfo<MessageModel>) {
    return (
      <>
        <ChatBubble message={item} />
        {item.action ? (
          <ChatActions
            action={item.action}
            onConnect={() => openConnectSheet(index, item.action?.retryMessage)}
            onConfirm={(confirmed) =>
              item.action?.conversationId
                ? handleConfirm(index, item.action.conversationId, confirmed)
                : undefined
            }
            onOpenEvent={(url) => openEvent(url)}
          />
        ) : null}
      </>
    );
  }

  // Web only: a multiline TextInput swallows onSubmitEditing, so we hook
  // the raw key event. Enter sends; Shift/Cmd/Ctrl/Alt+Enter inserts a
  // newline like every other modern chat UI.
  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
  ) => {
    if (Platform.OS !== 'web') return;
    const native = e.nativeEvent as TextInputKeyPressEventData & {
      shiftKey?: boolean;
      metaKey?: boolean;
      ctrlKey?: boolean;
      altKey?: boolean;
    };
    if (
      native.key === 'Enter' &&
      !native.shiftKey &&
      !native.metaKey &&
      !native.ctrlKey &&
      !native.altKey
    ) {
      // RN-Web exposes preventDefault() on the synthetic event at runtime.
      (e as unknown as { preventDefault?: () => void }).preventDefault?.();
      submit(draft);
    }
  };

  // Native: with multiline=true, Android ignores blurOnSubmit and inserts
  // a "\n" instead of firing onSubmitEditing. Detect the inserted newline
  // and treat it as Send — matches the iOS behaviour where blurOnSubmit
  // already routes Return through onSubmitEditing.
  const handleChangeText = (text: string) => {
    if (
      Platform.OS === 'android' &&
      text.length === draft.length + 1 &&
      text.endsWith('\n')
    ) {
      submit(draft);
      return;
    }
    setDraft(text);
  };

  const hasMessages = messages.length > 0;
  const canSend = draft.trim().length > 0 && !pending && ready;

  const placeholder = checking
    ? 'Connecting to Jimi…'
    : !online
      ? 'Jimi is offline'
      : 'Message Jimi…';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <AppBar />
        <KeyboardAvoidingView
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : Platform.OS === 'android'
                ? 'height'
                : undefined
          }
          style={styles.flex}
          keyboardVerticalOffset={0}
        >
          <View style={styles.contentWrap}>
            <View style={styles.content}>
              {hasMessages ? (
                <FlatList
                  ref={listRef}
                  data={messages}
                  keyExtractor={(_, idx) => String(idx)}
                  renderItem={renderItem}
                  contentContainerStyle={styles.list}
                  showsVerticalScrollIndicator={false}
                  onContentSizeChange={() =>
                    listRef.current?.scrollToEnd({ animated: true })
                  }
                  ListFooterComponent={pending ? <TypingIndicator /> : null}
                />
              ) : (
                <EmptyChat onSuggestionPress={submit} disabled={!ready} />
              )}
            </View>

            <View style={styles.inputRegion}>
              {status === 'offline' ? (
                <View style={styles.bannerWrap}>
                  <OfflineBanner
                    reason={errorReason}
                    retrying={checking}
                    onRetry={recheck}
                  />
                </View>
              ) : null}

              {ready && calendarConnected === false ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Connect a calendar"
                  onPress={() => openConnectSheet()}
                  style={({ pressed }) => [
                    styles.connectBanner,
                    pressed && styles.connectBannerPressed,
                  ]}
                >
                  <Text style={styles.connectBannerText}>
                    📅 Connect a calendar to let Jimi manage your events
                  </Text>
                  <Text style={styles.connectBannerCta}>Connect →</Text>
                </Pressable>
              ) : null}

              <View
                style={[
                  styles.inputBar,
                  !ready && styles.inputBarDisabled,
                ]}
              >
                <TextInput
                  style={[styles.input, webNoOutline]}
                  value={draft}
                  placeholder={placeholder}
                  placeholderTextColor={colors.hint}
                  onChangeText={handleChangeText}
                  onKeyPress={handleKeyPress}
                  onSubmitEditing={(e) => submit(e.nativeEvent.text)}
                  returnKeyType="send"
                  blurOnSubmit
                  editable={ready && !pending}
                  multiline
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Send message"
                  disabled={!canSend}
                  onPress={() => submit(draft)}
                  style={({ pressed }) => [
                    styles.sendButton,
                    !canSend && styles.sendButtonDisabled,
                    pressed && canSend && styles.sendButtonPressed,
                  ]}
                >
                  <Text style={styles.sendGlyph}>↑</Text>
                </Pressable>
              </View>

              <Text style={styles.footnote}>
                {online
                  ? 'Jimi can make mistakes. Double-check important details.'
                  : checking
                    ? 'Checking the connection to Jimi…'
                    : "We'll let you know as soon as Jimi is back."}
                {Platform.OS === 'web' ? (
                  <>
                    {'  ·  '}
                    <Link href="/privacy" style={styles.footnoteLink}>
                      Privacy
                    </Link>
                    {'  ·  '}
                    <Link href="/terms" style={styles.footnoteLink}>
                      Terms
                    </Link>
                  </>
                ) : null}
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>
        <ConnectCalendarSheet
          visible={connectSheet !== null}
          enabledProviders={enabledProviders}
          onClose={() => setConnectSheet(null)}
          onConnectOAuth={handleConnectOAuth}
          onConnectCalDav={handleConnectCalDav}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentWrap: {
    flex: 1,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: layout.maxContentWidth,
  },
  list: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
    flexGrow: 1,
  },
  inputRegion: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  bannerWrap: { marginBottom: spacing.sm },
  connectBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  connectBannerPressed: { opacity: 0.85 },
  connectBannerText: {
    flex: 1,
    fontFamily: typography.bodyFamily,
    fontSize: typography.caption,
    color: colors.text,
  },
  connectBannerCta: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.accentDeep,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    ...shadow.sm,
  },
  inputBarDisabled: {
    backgroundColor: colors.surfaceMuted,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    paddingHorizontal: spacing.sm,
    fontFamily: typography.bodyFamily,
    fontSize: typography.body,
    color: colors.text,
    maxHeight: 120,
    minHeight: 24,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
    marginBottom: 4,
  },
  sendButtonDisabled: {
    backgroundColor: colors.surfaceMuted,
  },
  sendButtonPressed: {
    backgroundColor: colors.accentDeep,
  },
  sendGlyph: {
    color: colors.surface,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
  },
  footnote: {
    marginTop: spacing.xs + 2,
    textAlign: 'center',
    fontFamily: typography.bodyFamily,
    fontSize: typography.micro,
    color: colors.hint,
  },
  footnoteLink: {
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
});

// Web-only: kill the focus ring on the textarea. Cast escapes the strict
// TextStyle typing since `outlineWidth` is a CSS-only property.
const webNoOutline =
  Platform.OS === 'web' ? ({ outlineWidth: 0 } as unknown as object) : null;
