import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TextInputProps, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { Glass } from './Glass';

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

  const borderColor = error ? colors.error : focused ? colors.glassBorderActive : colors.borderDark;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Glass
        level="low"
        radius={spacing.borderRadiusLg}
        borderColor={borderColor}
        glowColor={focused && !error ? colors.primary : undefined}
        contentStyle={styles.inputRow}>
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
            hitSlop={12}
            style={({ pressed }) => [styles.eyeBtn, pressed && { opacity: 0.6 }]}>
            <Ionicons
              name={visible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={focused ? colors.primary : colors.textMuted}
            />
          </Pressable>
        )}
      </Glass>
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 0,
    paddingHorizontal: 0,
    color: colors.textPrimary,
    fontSize: 15,
    includeFontPadding: false,
  },
  eyeBtn: {
    width: 52,
    height: 52,
    marginLeft: 8,
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
