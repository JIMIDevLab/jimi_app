import { useCallback, useRef, useState } from 'react';
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
import { sendMessage } from '../api/apiServicePost';
import { MessageModel } from '../models/Message';
import { useApiHealth } from '../contexts/ApiHealthContext';

export default function ChatScreen() {
  const [messages, setMessages] = useState<MessageModel[]>([]);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  const conversationIdRef = useRef<string | null>(null);
  const listRef = useRef<FlatList<MessageModel>>(null);
  const userId = useUserId();

  const { status, errorReason, recheck, reportFailure } = useApiHealth();
  const online = status === 'online';
  const checking = status === 'checking';
  const ready = online && userId !== null;

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
        conversationIdRef.current =
          answer.status === 'AWAITING_INFO' ? answer.conversationId : null;
        setMessages((prev) => [
          ...prev,
          {
            content: answer.message,
            sender: 'Chatbot',
            timestamp: Date.now(),
          },
        ]);
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

  function renderItem({ item }: ListRenderItemInfo<MessageModel>) {
    return <ChatBubble message={item} />;
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
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
          keyboardVerticalOffset={20}
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
                  onChangeText={setDraft}
                  onKeyPress={handleKeyPress}
                  onSubmitEditing={(e) => submit(e.nativeEvent.text)}
                  returnKeyType="send"
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
                  </>
                ) : null}
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>
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
