import React, { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors } from '../../constants/colors';

interface ToggleProps {
  value: boolean;
  onChange: (next: boolean) => void;
  /** Obligatorio: el interruptor no tiene texto propio. */
  accessibilityLabel: string;
  disabled?: boolean;
}

const TRACK_W = 52;
const KNOB = 26;
const PAD = 3;

/** Interruptor 52×32 del diseño (verde bosque encendido, gris salvia apagado). */
export const Toggle: React.FC<ToggleProps> = ({
  value,
  onChange,
  accessibilityLabel,
  disabled,
}) => {
  const x = useSharedValue(value ? TRACK_W - KNOB - PAD * 2 : 0);

  useEffect(() => {
    x.value = withTiming(value ? TRACK_W - KNOB - PAD * 2 : 0, { duration: 180 });
  }, [value, x]);

  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <Pressable
      onPress={() => onChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      hitSlop={6}
      style={{
        width: TRACK_W,
        height: 32,
        borderRadius: 16,
        padding: PAD,
        flexShrink: 0,
        backgroundColor: value ? colors.forest : colors.toggleOff,
        opacity: disabled ? 0.5 : 1,
      }}>
      <Animated.View
        style={[
          { width: KNOB, height: KNOB, borderRadius: 13, backgroundColor: colors.white },
          knob,
        ]}
      />
    </Pressable>
  );
};
