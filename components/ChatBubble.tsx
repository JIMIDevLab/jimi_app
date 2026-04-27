import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, shadow, spacing, typography } from '../theme/styles';
import { MessageModel } from '../models/Message';
import { RichText } from './RichText';

interface Props {
  message: MessageModel;
  showTimestamp?: boolean;
}

function formatTime(ts?: number): string {
  if (!ts) return '';
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function ChatBubble({ message, showTimestamp = true }: Props) {
  const sentByUser = message.sender === 'User';

  return (
    <View
      style={[
        styles.row,
        sentByUser ? styles.rowEnd : styles.rowStart,
      ]}
    >
      <View style={styles.column}>
        <View
          style={[
            styles.bubble,
            sentByUser ? styles.bubbleUser : styles.bubbleBot,
            sentByUser ? styles.tailRight : styles.tailLeft,
          ]}
        >
          {sentByUser ? (
            <Text
              style={[
                styles.text,
                styles.textUser,
              ]}
            >
              {message.content}
            </Text>
          ) : (
            <RichText
              content={message.content}
              baseStyle={{ ...styles.text, ...styles.textBot }}
            />
          )}
        </View>
        {showTimestamp && message.timestamp ? (
          <Text
            style={[
              styles.timestamp,
              sentByUser ? styles.timestampEnd : styles.timestampStart,
            ]}
          >
            {formatTime(message.timestamp)}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    flexDirection: 'row',
    paddingVertical: spacing.xs,
  },
  rowStart: { justifyContent: 'flex-start' },
  rowEnd: { justifyContent: 'flex-end' },
  column: { maxWidth: '85%' },
  bubble: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md + 2,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  bubbleUser: {
    backgroundColor: colors.bubbleUser,
    ...shadow.sm,
  },
  bubbleBot: {
    backgroundColor: colors.bubbleBot,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow.sm,
  },
  tailLeft: {
    borderBottomRightRadius: radius.lg,
    borderBottomLeftRadius: 4,
  },
  tailRight: {
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: 4,
  },
  text: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.body,
    lineHeight: 22,
  },
  textUser: { color: colors.bubbleUserText },
  textBot: { color: colors.bubbleBotText },
  timestamp: {
    fontFamily: typography.bodyFamily,
    fontSize: typography.micro,
    color: colors.hint,
    marginTop: 4,
  },
  timestampStart: { textAlign: 'left', marginLeft: 8 },
  timestampEnd: { textAlign: 'right', marginRight: 8 },
});
