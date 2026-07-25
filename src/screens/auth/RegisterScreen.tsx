import React, { useState } from 'react';
import { StyleSheet, Text, Pressable, ScrollView, Alert } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SpatialContainer } from '../../components/SpatialContainer';
import { GlassCard } from '../../components/GlassCard';
import { AuthInput } from '../../components/AuthInput';
import { AuthButton } from '../../components/AuthButton';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { useAuth } from '../../hooks/useAuth';
import { validation } from '../../utils/validation';

export const RegisterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { register } = useAuth();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!nombre.trim()) {
      Alert.alert('Nombre requerido', 'Por favor ingresa tu nombre completo.');
      return;
    }
    if (!validation.isValidEmail(email)) {
      Alert.alert('Email inválido', 'Ingresa un correo electrónico válido.');
      return;
    }
    if (!validation.isValidPassword(password)) {
      Alert.alert('Contraseña corta', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (!validation.doPasswordsMatch(password, confirmPassword)) {
      Alert.alert('Contraseñas no coinciden', 'Las contraseñas ingresadas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await register({
        nombre,
        email,
        password,
      });
    } catch (err: any) {
      Alert.alert('Error de registro', err.message || 'No se pudo completar el registro.');
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
          <Text style={styles.title}>Crear una Cuenta</Text>
          <Text style={styles.subtitle}>
            Regístrate para tener un espacio seguro donde conversar
          </Text>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(200).springify()}>
          <GlassCard style={styles.formCard}>
            <AuthInput
              label="Nombre Completo"
              placeholder="María Quispe"
              value={nombre}
              onChangeText={setNombre}
            />

            <AuthInput
              label="Correo Electrónico"
              placeholder="maria@ejemplo.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />

            <AuthInput
              label="Contraseña"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              showToggle
            />

            <AuthInput
              label="Confirmar Contraseña"
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              showToggle
            />

            <AuthButton label="Crear Cuenta" loading={loading} onPress={handleRegister} />

            <Pressable
              style={({ pressed }) => [styles.loginLink, pressed && { opacity: 0.7 }]}
              onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLinkText}>
                ¿Ya tienes una cuenta? <Text style={styles.loginHighlight}>Inicia Sesión</Text>
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
    padding: spacing.screenPadding,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  formCard: {
    width: '100%',
  },
  loginLink: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  loginLinkText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  loginHighlight: {
    color: colors.primary,
    fontWeight: 'bold',
  },
});
