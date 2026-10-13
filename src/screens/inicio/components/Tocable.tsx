import React, { ReactNode } from 'react';
import { Platform, Pressable, PressableProps, StyleProp, View, ViewStyle } from 'react-native';
import { colors } from '../../../constants/colors';

interface TocableProps extends Omit<PressableProps, 'style' | 'children'> {
  children: ReactNode;
  /** Radio de la superficie (recorta también la onda de Android). */
  rounded: number;
  /** Fondo de la superficie. */
  bg?: string;
  /** Color de la onda en Android: `colors.ripple` (claras) o `colors.rippleOnDark` (oscuras). */
  ripple?: string;
  /** Caja exterior: tamaño y posición (`flex`, `width`, `marginTop`…). */
  style?: StyleProp<ViewStyle>;
  /** Contenido interior: padding, dirección, gap… */
  contentStyle?: StyleProp<ViewStyle>;
  /** Opacidad al pulsar en iOS y web (en Android la respuesta es la onda). */
  pressedOpacity?: number;
}

/**
 * Superficie tocable con respuesta nativa: onda (`android_ripple`) en Android
 * y opacidad en iOS. En Android la onda de fondo no respeta `borderRadius`
 * (máscara rectangular), así que se recorta con una caja exterior
 * `overflow: 'hidden'`. Sin sombras: el diseño es plano.
 */
export const Tocable: React.FC<TocableProps> = ({
  children,
  rounded,
  bg = colors.surface,
  ripple = colors.ripple,
  style,
  contentStyle,
  pressedOpacity = 0.85,
  ...rest
}) => (
  <View style={[{ borderRadius: rounded, backgroundColor: bg, overflow: 'hidden' }, style]}>
    <Pressable
      accessibilityRole="button"
      android_ripple={{ color: ripple }}
      {...rest}
      style={({ pressed }) => [
        { flexGrow: 1 },
        contentStyle,
        Platform.OS !== 'android' && pressed && { opacity: pressedOpacity },
        rest.disabled && { opacity: 0.5 },
      ]}>
      {children}
    </Pressable>
  </View>
);
