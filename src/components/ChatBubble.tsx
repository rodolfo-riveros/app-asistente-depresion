import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChatMessage } from '../types/chat';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { formatters } from '../utils/formatters';
import { AvatarAssistant } from './AvatarAssistant';

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
          <View style={styles.assistantBubble}>
            <Text style={styles.assistantText}>{message.content}</Text>
          </View>
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
  assistantBubble: {
    backgroundColor: colors.assistantBg,
    borderColor: colors.assistantBorder,
    borderWidth: 1,
    borderTopLeftRadius: 4,
    borderTopRightRadius: spacing.borderRadiusMd,
    borderBottomLeftRadius: spacing.borderRadiusMd,
    borderBottomRightRadius: spacing.borderRadiusMd,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
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
    borderTopLeftRadius: spacing.borderRadiusMd,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: spacing.borderRadiusMd,
    borderBottomRightRadius: spacing.borderRadiusMd,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
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
