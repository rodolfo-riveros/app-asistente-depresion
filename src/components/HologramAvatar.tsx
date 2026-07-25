import React, { useEffect } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../constants/colors';

type Emotion = 'listening' | 'empathetic' | 'concerned' | 'inspiring' | 'neutral';

interface HologramAvatarProps {
  emotion?: Emotion;
  typing?: boolean;
  voiceMode?: boolean;
  onPress?: () => void;
}

const emotionColors: Record<Emotion, string> = {
  listening: colors.accent,
  empathetic: colors.danger,
  concerned: colors.warning,
  inspiring: colors.primary,
  neutral: colors.primary,
};

const Ring: React.FC<{ delay: number; color: string; size: number }> = ({ delay, color, size }) => {
  const opacity = useSharedValue(0.4);
  const scale = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
          marginLeft: -delay,
          marginTop: -delay,
        },
        ringStyle,
      ]}
    />
  );
};

export const HologramAvatar: React.FC<HologramAvatarProps> = ({
  emotion = 'neutral',
  typing = false,
  voiceMode = false,
  onPress,
}) => {
  const color = emotionColors[emotion];
  const avatarSize = 72;
  const ringBase = avatarSize + 16;

  return (
    <Pressable onPress={onPress} style={styles.wrapper}>
      <View style={styles.ringContainer}>
        <Ring delay={0} color={color} size={ringBase} />
        <Ring delay={200} color={color} size={ringBase + 20} />
        <Ring delay={400} color={color} size={ringBase + 40} />

        <View
          style={[
            styles.avatar,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
              borderColor: color,
            },
          ]}>
          <Ionicons
            name={voiceMode ? 'mic' : typing ? 'chatbubble-ellipses-outline' : 'heart-outline'}
            size={32}
            color={color}
          />
        </View>
      </View>
      {voiceMode && (
        <View style={styles.voiceBadge}>
          <Ionicons name="mic" size={12} color={colors.onPrimary} />
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  ringContainer: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
  },
  avatar: {
    backgroundColor: colors.primaryContainer,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  voiceBadge: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    backgroundColor: colors.accent,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
});
