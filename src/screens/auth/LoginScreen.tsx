import React, { useState } from 'react';
import { StyleSheet, Text, ScrollView, Pressable, Alert } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SpatialContainer } from '../../components/SpatialContainer';
import { GlassCard } from '../../components/GlassCard';
import { AvatarAssistant } from '../../components/AvatarAssistant';
import { AuthInput } from '../../components/AuthInput';
import { AuthButton } from '../../components/AuthButton';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { useAuth } from '../../hooks/useAuth';
import { validation } from '../../utils/validation';

export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!email.trim()) {
      next.email = 'El correo electrónico es obligatorio';
    } else if (!validation.isValidEmail(email)) {
      next.email = 'Ingresa un correo electrónico válido';
    }
    if (!password.trim()) {
      next.password = 'La contraseña es obligatoria';
    } else if (!validation.isValidPassword(password)) {
      next.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await login({ email, password });
    } catch (err: any) {
      Alert.alert('Error de acceso', err.message || 'Email o contraseña incorrectos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SpatialContainer>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(600).springify()} style={styles.header}>
          <AvatarAssistant size="lg" emotion="inspiring" />
          <Text style={styles.appName}>Asistente Hamilton</Text>
          <Text style={styles.tagline}>Tu acompañante para el bienestar mental</Text>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(200).springify()}>
          <GlassCard style={styles.formCard}>
            <Text style={styles.formTitle}>Iniciar Sesión</Text>

            <AuthInput
              label="Correo Electrónico"
              placeholder="maria@ejemplo.com"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setErrors((prev) => ({ ...prev, email: '' }));
              }}
              keyboardType="email-address"
              error={errors.email}
            />

            <AuthInput
              label="Contraseña"
              placeholder="••••••••"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setErrors((prev) => ({ ...prev, password: '' }));
              }}
              secureTextEntry
              showToggle
              error={errors.password}
              onSubmitEditing={handleLogin}
            />

            <AuthButton label="Ingresar" loading={loading} onPress={handleLogin} />

            <Pressable
              style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.7 }]}
              onPress={() => navigation.navigate('Register')}>
              <Text style={styles.linkText}>
                ¿No tienes cuenta? <Text style={styles.linkHighlight}>Regístrate</Text>
              </Text>
            </Pressable>
          </GlassCard>
        </Animated.View>
      </ScrollView>
    </SpatialContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  tagline: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 20,
    maxWidth: 280,
  },
  formCard: {
    width: '100%',
  },
  linkRow: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  linkText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  linkHighlight: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
});
