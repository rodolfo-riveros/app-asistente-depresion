import React from 'react';
import { StyleSheet, View, Image } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors } from '../constants/colors';
import { glassGlow } from '../constants/glass';

const avatarImage = require('../../assets/avatar.png');

type Emotion = 'listening' | 'empathetic' | 'concerned' | 'inspiring' | 'neutral';

interface AvatarAssistantProps {
  size?: 'sm' | 'md' | 'lg';
  emotion?: Emotion;
}

const emotionBorders: Record<Emotion, string> = {
  listening: colors.accent,
  empathetic: colors.secondary,
  concerned: colors.warning,
  inspiring: colors.primary,
  neutral: colors.primary,
};

export const AvatarAssistant: React.FC<AvatarAssistantProps> = ({
  size = 'md',
  emotion = 'neutral',
}) => {
  const dims = size === 'lg' ? 64 : size === 'md' ? 44 : 32;
  const borderColor = emotionBorders[emotion];

  return (
    <Animated.View entering={FadeIn.duration(400)}>
      <View
        style={[
          styles.avatar,
          glassGlow(borderColor, size === 'lg' ? 20 : 10),
          {
            width: dims,
            height: dims,
            borderRadius: dims / 2,
            borderColor,
          },
        ]}>
        <Image
          source={avatarImage}
          style={[
            styles.image,
            {
              width: dims,
              height: dims,
              borderRadius: dims / 2,
              top: -4,
            },
          ]}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: colors.glassBgLight,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
});
