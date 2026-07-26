import React, { ReactNode } from 'react';
import { StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { GlassLevel } from '../constants/glass';
import { Glass } from './Glass';

interface GlassCardProps {
  children: ReactNode;
  /** Caja de layout exterior: márgenes, ancho, posición. NO padding. */
  style?: StyleProp<ViewStyle>;
  /** Layout interior: padding extra, alineación del contenido. */
  contentStyle?: StyleProp<ViewStyle>;
  /** Tinte del borde (p. ej. color de severidad). */
  glowColor?: string;
  active?: boolean;
  level?: GlassLevel;
  radius?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  contentStyle,
  glowColor,
  active = false,
  level = 'base',
  radius,
}) => {
  const borderColor = active ? colors.glassBorderActive : glowColor;

  return (
    <Glass
      level={level}
      radius={radius}
      style={style}
      contentStyle={[styles.content, contentStyle]}
      borderColor={borderColor}
      glowColor={active ? colors.primary : glowColor}
      highlight={false}>
      {children}
    </Glass>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: spacing.cardPadding,
  },
});
