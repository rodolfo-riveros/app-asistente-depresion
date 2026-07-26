import React, { useEffect } from 'react';
import { StyleSheet, View, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../constants/colors';
import { glassGlow } from '../constants/glass';

const avatarImage = require('../../assets/avatar.png');

type Emotion = 'listening' | 'empathetic' | 'concerned' | 'inspiring' | 'neutral';

interface HologramAvatarProps {
  emotion?: Emotion;
  typing?: boolean;
  voiceMode?: boolean;
  onPress?: () => void;
  size?: 'sm' | 'lg';
}

const emotionColors: Record<Emotion, string> = {
  listening: colors.accent,
  empathetic: colors.accent,
  concerned: colors.warning,
  inspiring: colors.primary,
  neutral: colors.primary,
};

/** Halo único, lento y de baja opacidad. Sustituye a los anillos concéntricos. */
const Halo: React.FC<{ color: string; size: number; active: boolean }> = ({
  color,
  size,
  active,
}) => {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: active ? 1400 : 2600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [pulse, active]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.1 + pulse.value * (active ? 0.22 : 0.12),
    transform: [{ scale: 1 + pulse.value * 0.1 }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.halo,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        haloStyle,
      ]}
    />
  );
};

export const HologramAvatar: React.FC<HologramAvatarProps> = ({
  emotion = 'neutral',
  typing = false,
  voiceMode = false,
  onPress,
  size = 'lg',
}) => {
  const color = emotionColors[emotion];
  const isSmall = size === 'sm';
  const avatarSize = isSmall ? 40 : 76;
  const haloSize = avatarSize + (isSmall ? 16 : 44);

  return (
    <Pressable onPress={onPress} style={isSmall ? styles.wrapperSmall : styles.wrapper}>
      <View style={[styles.stack, { width: haloSize, height: haloSize }]}>
        <Halo color={color} size={haloSize} active={typing || voiceMode} />

        <View
          style={[
            styles.avatar,
            glassGlow(color, isSmall ? 12 : 24),
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
              borderColor: color,
            },
          ]}>
          <Image
            source={avatarImage}
            style={{
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
              top: -4,
            }}
            resizeMode="cover"
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
  wrapperSmall: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stack: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
  },
  avatar: {
    backgroundColor: colors.glassBgLight,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primaryStrong,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorderStrong,
  },
});
