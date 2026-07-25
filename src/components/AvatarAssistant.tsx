import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors } from '../constants/colors';

type Emotion = 'listening' | 'empathetic' | 'concerned' | 'inspiring' | 'neutral';

interface AvatarAssistantProps {
  size?: 'sm' | 'md' | 'lg';
  emotion?: Emotion;
}

const icons: Record<Emotion, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  listening: { name: 'ear-outline', color: colors.accent },
  empathetic: { name: 'heart-outline', color: colors.danger },
  concerned: { name: 'alert-circle-outline', color: colors.warning },
  inspiring: { name: 'sparkles-outline', color: colors.primary },
  neutral: { name: 'sparkles-outline', color: colors.primary },
};

export const AvatarAssistant: React.FC<AvatarAssistantProps> = ({
  size = 'md',
  emotion = 'neutral',
}) => {
  const dims = size === 'lg' ? 64 : size === 'md' ? 44 : 32;
  const iconSize = size === 'lg' ? 28 : size === 'md' ? 20 : 16;
  const icon = icons[emotion];

  return (
    <Animated.View entering={FadeIn.duration(400)}>
      <View
        style={[
          styles.avatar,
          {
            width: dims,
            height: dims,
            borderRadius: dims / 2,
          },
        ]}>
        <Ionicons name={icon.name as any} size={iconSize} color={icon.color} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.glassBorderActive,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
});
