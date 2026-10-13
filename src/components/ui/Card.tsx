import React, { ReactNode } from 'react';
import { Platform, Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';

export type CardTone = 'white' | 'sage' | 'peach' | 'danger' | 'muted' | 'dark' | 'accent';

const tones: Record<CardTone, string> = {
  white: colors.surface,
  sage: colors.sage,
  peach: colors.peachPale,
  danger: colors.dangerBg,
  muted: colors.background,
  dark: colors.ink,
  accent: colors.accent,
};

interface CardProps {
  children?: ReactNode;
  tone?: CardTone;
  /** Radio: 22 en tarjetas grandes, 18 en filas de lista, 14 en celdas. */
  rounded?: number;
  padding?: number;
  gap?: number;
  /** Borde fino (p. ej. tarjeta del chequeo dentro del chat). */
  bordered?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Superficie plana del diseño: sin sombra, esquinas generosas. */
export const Card: React.FC<CardProps> = ({
  children,
  tone = 'white',
  rounded = radius.card,
  padding = spacing.cardPadding,
  gap = 12,
  bordered = false,
  onPress,
  accessibilityLabel,
  style,
}) => {
  const base: ViewStyle = {
    backgroundColor: tones[tone],
    borderRadius: rounded,
    padding,
    gap,
    borderWidth: bordered ? 1 : 0,
    borderColor: colors.sage,
  };

  if (onPress) {
    // Android dibuja la onda como un rectángulo que ignora `borderRadius`: la
    // caja exterior con `overflow: hidden` la recorta a las esquinas. En iOS
    // (sin onda nativa) se baja la opacidad al pulsar. `style` va a la caja
    // exterior (márgenes, ancho, flex); la distribución interna, en los hijos.
    const oscura = tone === 'dark';
    return (
      <View style={[{ borderRadius: rounded, overflow: 'hidden' }, style]}>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          android_ripple={{ color: oscura ? colors.rippleOnDark : colors.ripple }}
          style={({ pressed }) => [
            base,
            { flexGrow: 1 },
            Platform.OS !== 'android' && pressed && { opacity: 0.85 },
          ]}>
          {children}
        </Pressable>
      </View>
    );
  }

  return <View style={[base, style]}>{children}</View>;
};
