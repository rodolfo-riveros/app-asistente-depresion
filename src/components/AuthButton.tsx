import React from 'react';
import { StyleSheet, Text, ActivityIndicator, Pressable, ViewStyle } from 'react-native';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';

interface AuthButtonProps {
  label: string;
  loading?: boolean;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  label,
  loading,
  onPress,
  variant = 'primary',
  style,
}) => {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      style={[styles.btn, !isPrimary && styles.secondary, style]}
      onPress={onPress}
      disabled={loading}>
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.onPrimary : colors.primary} />
      ) : (
        <Text style={[styles.btnText, !isPrimary && { color: colors.primary }]}>{label}</Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: spacing.borderRadiusLg,
    alignItems: 'center',
    marginTop: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
    shadowOpacity: 0,
    elevation: 0,
  },
  btnText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
