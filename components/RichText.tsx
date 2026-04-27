import { Fragment, ReactNode } from 'react';
import { View, Text, StyleSheet, TextStyle } from 'react-native';
import { spacing } from '../theme/styles';

// A tiny markdown-lite renderer for assistant messages. Supports:
//   - **bold**          → <Text bold>
//   - *italic*          → <Text italic>
//   - line breaks (\n)  → new paragraph
//   - leading "- ", "* ", "• " → bullet row
// Keeps everything inside React Native primitives so it works on web + native
// without pulling in a markdown library.

interface Props {
  content: string;
  baseStyle?: TextStyle;
}

export function RichText({ content, baseStyle }: Props) {
  const lines = content.replace(/\r\n?/g, '\n').split('\n');

  return (
    <View>
      {lines.map((line, idx) => {
        const trimmed = line.trimStart();
        const bulletMatch = trimmed.match(/^([-*•])\s+(.*)$/);

        if (bulletMatch) {
          const text = bulletMatch[2];
          return (
            <View key={idx} style={styles.bulletRow}>
              <Text style={[baseStyle, styles.bulletGlyph]}>•</Text>
              <Text style={[baseStyle, styles.bulletContent]}>
                {renderInline(text, baseStyle)}
              </Text>
            </View>
          );
        }

        if (trimmed === '') {
          return <View key={idx} style={styles.spacer} />;
        }

        return (
          <Text key={idx} style={baseStyle}>
            {renderInline(line, baseStyle)}
          </Text>
        );
      })}
    </View>
  );
}

// Splits one line into <Text> spans, applying bold/italic where matched.
// Handles **bold** first, then *italic*. Anything unmatched is plain text.
function renderInline(line: string, baseStyle?: TextStyle): ReactNode {
  const tokens = tokenize(line);
  return tokens.map((tok, i) => {
    if (tok.kind === 'bold') {
      return (
        <Text key={i} style={[baseStyle, styles.bold]}>
          {tok.text}
        </Text>
      );
    }
    if (tok.kind === 'italic') {
      return (
        <Text key={i} style={[baseStyle, styles.italic]}>
          {tok.text}
        </Text>
      );
    }
    return <Fragment key={i}>{tok.text}</Fragment>;
  });
}

type Token = { kind: 'plain' | 'bold' | 'italic'; text: string };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let buffer = '';

  const flush = () => {
    if (buffer.length > 0) {
      tokens.push({ kind: 'plain', text: buffer });
      buffer = '';
    }
  };

  while (i < input.length) {
    if (input.startsWith('**', i)) {
      const end = input.indexOf('**', i + 2);
      if (end !== -1) {
        flush();
        tokens.push({ kind: 'bold', text: input.slice(i + 2, end) });
        i = end + 2;
        continue;
      }
    }
    if (
      input[i] === '*' &&
      input[i + 1] !== '*' &&
      input[i + 1] !== ' '
    ) {
      const end = input.indexOf('*', i + 1);
      if (end !== -1 && input[end - 1] !== ' ') {
        flush();
        tokens.push({ kind: 'italic', text: input.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }
    buffer += input[i];
    i += 1;
  }
  flush();
  return tokens;
}

const styles = StyleSheet.create({
  bold: { fontWeight: '700' },
  italic: { fontStyle: 'italic' },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 2,
  },
  bulletGlyph: {
    width: 16,
    textAlign: 'center',
    marginRight: spacing.xs,
  },
  bulletContent: {
    flex: 1,
  },
  spacer: { height: spacing.xs },
});
