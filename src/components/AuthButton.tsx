import React from 'react';
import { StyleSheet, Text, ActivityIndicator, Pressable, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { glassShadow, glassGlow, glassHighlightGradient } from '../constants/glass';
import { Glass } from './Glass';

type Variant = 'primary' | 'secondary' | 'danger';

interface AuthButtonProps {
  label: string;
  loading?: boolean;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: ViewStyle;
}

const fills: Record<'primary' | 'danger', readonly [string, string]> = {
  primary: colors.primaryGradient,
  danger: colors.dangerGradient,
};

export const AuthButton: React.FC<AuthButtonProps> = ({
  label,
  loading,
  onPress,
  variant = 'primary',
  disabled,
  style,
}) => {
  const isDisabled = Boolean(loading || disabled);

  // Fantasma de vidrio: se apoya en el fondo en vez de taparlo.
  if (variant === 'secondary') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: Boolean(loading) }}
        style={({ pressed }) => [styles.wrapper, style, pressed && styles.pressed]}>
        <Glass
          level="base"
          radius={spacing.borderRadiusXl}
          borderColor={colors.outlineVariant}
          contentStyle={styles.content}>
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={[styles.label, styles.labelGhost]}>{label}</Text>
          )}
        </Glass>
      </Pressable>
    );
  }

  const gradient = fills[variant];
  const glowColor = variant === 'danger' ? colors.danger : colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: Boolean(loading) }}
      style={({ pressed }) => [
        styles.wrapper,
        glassShadow.base,
        glassGlow(glowColor, 18),
        style,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fill}>
        <LinearGradient
          pointerEvents="none"
          colors={glassHighlightGradient}
          style={styles.highlight}
        />
        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.label}>{label}</Text>
          )}
        </View>
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginTop: spacing.lg,
    borderRadius: spacing.borderRadiusXl,
  },
  fill: {
    borderRadius: spacing.borderRadiusXl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  content: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  labelGhost: {
    color: colors.primary,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.5,
  },
});
