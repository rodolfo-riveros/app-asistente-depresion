import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TextInputProps, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';

interface AuthInputProps extends TextInputProps {
  label: string;
  error?: string;
  showToggle?: boolean;
}

export const AuthInput: React.FC<AuthInputProps> = ({
  label,
  error,
  value,
  showToggle,
  secureTextEntry,
  ...props
}) => {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);

  const borderStyle = useAnimatedStyle(() => {
    const borderColor = focused
      ? colors.glassBorderActive
      : error
        ? colors.error
        : colors.glassBorder;
    return {
      borderColor: withSpring(borderColor, { stiffness: 400, damping: 25 }),
    };
  });

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Animated.View style={[styles.inputContainer, borderStyle]}>
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.textMuted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          value={value}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={showToggle ? !visible : secureTextEntry}
          {...props}
        />
        {showToggle && (
          <Pressable
            onPress={() => setVisible((prev) => !prev)}
            style={({ pressed }) => [styles.eyeBtn, pressed && { opacity: 0.6 }]}>
            <Ionicons
              name={visible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        )}
      </Animated.View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 250, 252, 0.92)',
    borderWidth: 1,
    borderRadius: spacing.borderRadiusLg,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.inputPaddingHorizontal,
    paddingVertical: spacing.inputPaddingVertical,
    color: colors.textPrimary,
    fontSize: 15,
  },
  eyeBtn: {
    paddingHorizontal: spacing.inputPaddingHorizontal,
    justifyContent: 'center',
    alignItems: 'center',
  },

  error: {
    fontSize: 12,
    color: colors.error,
    marginTop: 6,
    fontWeight: '500',
  },
});
