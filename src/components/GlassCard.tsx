import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';

interface GlassCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  glowColor?: string;
  active?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  glowColor,
  active = false,
}) => {
  const highlightBorder = active ? colors.glassBorderActive : glowColor || colors.glassBorder;

  return <View style={[styles.card, { borderColor: highlightBorder }, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.glassBg,
    borderRadius: spacing.borderRadiusXl,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',

    shadowColor: colors.primaryGlow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 6,
  },
});
