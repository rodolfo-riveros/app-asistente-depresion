import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { SpatialContainer } from '../../components/SpatialContainer';
import { colors } from '../../constants/colors';
import { asistente } from '../../constants/asistente';
import { spacing } from '../../constants/spacing';
import { AvatarAssistant } from '../../components/AvatarAssistant';

export const SplashScreen: React.FC = () => {
  return (
    <SpatialContainer style={styles.container}>
      <View style={styles.content}>
        <AvatarAssistant size="lg" emotion="inspiring" />
        <Text style={styles.title}>{asistente.nombre}</Text>
        <Text style={styles.subtitle}>
          Tu espacio confidencial de acompañamiento y bienestar emocional
        </Text>
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      </View>
    </SpatialContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  loader: {
    marginTop: spacing.xxl,
  },
});
