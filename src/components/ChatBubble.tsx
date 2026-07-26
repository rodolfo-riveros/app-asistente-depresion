import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChatMessage } from '../types/chat';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { glassShadow, glassHighlightGradient } from '../constants/glass';
import { formatters } from '../utils/formatters';
import { AvatarAssistant } from './AvatarAssistant';
import { Glass } from './Glass';

interface ChatBubbleProps {
  message: ChatMessage;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isAssistant = message.role === 'assistant';

  if (isAssistant) {
    return (
      <View style={styles.assistantRow}>
        <AvatarAssistant size="sm" emotion={message.emotion || 'empathetic'} />
        <View style={styles.assistantContainer}>
          <Glass
            level="base"
            radius={spacing.borderRadiusLg}
            radiusStyle={styles.assistantRadius}
            contentStyle={styles.bubbleContent}>
            <Text style={styles.assistantText}>{message.content}</Text>
          </Glass>
          <Text style={styles.timestampLeft}>{formatters.formatTime(message.timestamp)}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.userRow}>
      <View style={styles.userContainer}>
        <LinearGradient
          colors={colors.userBgGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.userBubble}>
          <LinearGradient
            pointerEvents="none"
            colors={glassHighlightGradient}
            style={styles.userHighlight}
          />
          <Text style={styles.userText}>{message.content}</Text>
        </LinearGradient>
        <Text style={styles.timestampRight}>{formatters.formatTime(message.timestamp)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  assistantRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: spacing.xs + 2,
    marginRight: 40,
  },
  assistantContainer: {
    marginLeft: spacing.sm,
    flexShrink: 1,
  },
  assistantRadius: {
    borderTopLeftRadius: 6,
    borderTopRightRadius: spacing.borderRadiusLg,
    borderBottomLeftRadius: spacing.borderRadiusLg,
    borderBottomRightRadius: spacing.borderRadiusLg,
  },
  bubbleContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
  },
  assistantText: {
    color: colors.assistantText,
    fontSize: 15,
    lineHeight: 22,
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginVertical: spacing.xs + 2,
    marginLeft: 40,
  },
  userContainer: {
    alignItems: 'flex-end',
    flexShrink: 1,
  },
  userBubble: {
    borderTopLeftRadius: spacing.borderRadiusLg,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: spacing.borderRadiusLg,
    borderBottomRightRadius: spacing.borderRadiusLg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    ...glassShadow.low,
  },
  userHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  userText: {
    color: colors.userText,
    fontSize: 15,
    lineHeight: 22,
  },
  timestampLeft: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 3,
    marginLeft: 4,
  },
  timestampRight: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 3,
    marginRight: 4,
  },
});
