import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../constants/colors';

interface VoiceWaveProps {
  speaking?: boolean;
}

const BAR_COUNT = 9;
const BAR_HEIGHT = 130;
const BAR_WIDTH = 7;

/** Reposo y actividad por barra: perfil de campana, más alto al centro. */
const profile = [0.22, 0.34, 0.5, 0.72, 1, 0.72, 0.5, 0.34, 0.22];

const Bar: React.FC<{ index: number; active: boolean }> = ({ index, active }) => {
  const scale = useSharedValue(0.12);

  useEffect(() => {
    const peak = profile[index] * (active ? 1 : 0.34);
    const duration = (active ? 380 : 900) + index * 40;

    scale.value = withDelay(
      index * 70,
      withRepeat(
        withTiming(Math.max(peak, 0.08), { duration, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      )
    );
  }, [scale, index, active]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: scale.value }],
  }));

  return (
    <Animated.View style={[styles.bar, animStyle]}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark, colors.accent]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
};

/**
 * Ecualizador de voz: barras verticales, sobrio y direccional.
 * (Sustituye a la nube de puntos de colores del diseño anterior.)
 */
export const VoiceWave: React.FC<VoiceWaveProps> = ({ speaking = false }) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: BAR_COUNT }, (_, i) => (
        <Bar key={i} index={i} active={speaking} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    width: BAR_WIDTH,
    height: BAR_HEIGHT,
    marginHorizontal: 5,
    borderRadius: BAR_WIDTH / 2,
    overflow: 'hidden',
    backgroundColor: colors.primary,
  },
});
