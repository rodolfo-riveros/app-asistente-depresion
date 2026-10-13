import React, { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { colors } from '../../constants/colors';
import { radius, sizes } from '../../constants/spacing';
import { Icon, IconName } from './Icon';
import { Txt } from './Txt';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent';
export type ButtonSize = 'lg' | 'md' | 'sm';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  /** Icono a la derecha del texto (p. ej. flecha de "Empezar"). */
  iconRight?: IconName;
  loading?: boolean;
  disabled?: boolean;
  /** Ocupa el ancho disponible del padre en un `flexDirection: row`. */
  grow?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
  children?: ReactNode;
}

const heights: Record<ButtonSize, number> = { lg: sizes.buttonLg, md: sizes.buttonMd, sm: 44 };
const fontSizes: Record<ButtonSize, number> = { lg: 16, md: 14.5, sm: 14 };

const palette: Record<ButtonVariant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: colors.ink, fg: colors.onDark },
  secondary: { bg: colors.surface, fg: colors.ink },
  outline: { bg: colors.transparent, fg: colors.ink, border: colors.border },
  ghost: { bg: colors.transparent, fg: colors.forest },
  danger: { bg: colors.dangerBg, fg: colors.dangerInk },
  accent: { bg: colors.accent, fg: colors.ink },
};

/** Botón en píldora del diseño Aliento. `primary` = fondo tinta, texto claro. */
export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  grow = false,
  style,
  accessibilityHint,
}) => {
  const p = palette[variant];
  const h = heights[size];
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        {
          // minHeight: con fuente grande la etiqueta puede ocupar dos líneas sin salirse.
          minHeight: h,
          paddingVertical: 8,
          borderRadius: radius.full,
          backgroundColor: p.bg,
          borderWidth: p.border ? 1 : 0,
          borderColor: p.border,
          paddingHorizontal: size === 'sm' ? 16 : 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          opacity: inactive ? 0.55 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        grow && { flexGrow: 1, flexBasis: 0 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
          {icon && <Icon name={icon} size={18} color={p.fg} strokeWidth={2} />}
          <Txt
            size={fontSizes[size]}
            weight="semibold"
            color={p.fg}
            align="center"
            numberOfLines={2}
            style={{ flexShrink: 1 }}>
            {label}
          </Txt>
          {iconRight && <Icon name={iconRight} size={18} color={p.fg} strokeWidth={2} />}
        </View>
      )}
    </Pressable>
  );
};
