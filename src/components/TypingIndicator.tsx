import React, { useEffect, useState } from 'react';
import { Animated, View } from 'react-native';
import { colors } from '../constants/colors';
import { asistente } from '../constants/asistente';

/** Tres puntos que laten dentro de una burbuja del asistente. */
export const TypingIndicator: React.FC = () => {
  const [dots] = useState(() => [0, 1, 2].map(() => new Animated.Value(0.3)));

  useEffect(() => {
    const animaciones = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 200),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ])
      )
    );
    animaciones.forEach((a) => a.start());
    return () => animaciones.forEach((a) => a.stop());
  }, [dots]);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${asistente.nombre} está escribiendo`}
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: colors.surface,
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        borderBottomRightRadius: 18,
        borderBottomLeftRadius: 6,
      }}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: 4,
            backgroundColor: colors.moss,
            opacity: dot,
          }}
        />
      ))}
    </View>
  );
};
