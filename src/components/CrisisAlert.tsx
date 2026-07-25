import React from 'react';
import { StyleSheet, View, Text, Pressable, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';

interface CrisisAlertProps {
  onClose: () => void;
  onRequestLocation: () => void;
}

export const CrisisAlert: React.FC<CrisisAlertProps> = ({ onClose, onRequestLocation }) => {
  const handleCall = (number: string) => {
    Linking.openURL(`tel:${number}`).catch(() =>
      Alert.alert('Error', `No se pudo realizar la llamada al ${number}.`)
    );
  };

  const handleCopy = (number: string) => {
    Alert.alert('Número copiado', `El número ${number} ha sido copiado.`);
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.badge}>
            <Ionicons name="heart" size={14} color={colors.danger} />
            <Text style={styles.badgeText}> Estamos contigo</Text>
          </View>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}>
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </Pressable>
        </View>

        <Text style={styles.title}>Líneas de Apoyo y Emergencia</Text>
        <Text style={styles.subtitle}>
          Si estás en una situación difícil, recuerda que no estás solo. Estos servicios están
          disponibles para ti.
        </Text>

        <View style={styles.helplineCard}>
          <View style={styles.helplineInfo}>
            <Text style={styles.helplineName}>Línea 113 (Opción 5)</Text>
            <Text style={styles.helplineDesc}>MINSA - Atención Psicológica 24/7</Text>
          </View>
          <View style={styles.helplineActions}>
            <Pressable
              style={({ pressed }) => [styles.secondaryAction, pressed && { opacity: 0.8 }]}
              onPress={() => handleCopy('113')}>
              <Ionicons name="copy-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.secondaryActionText}> Copiar</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.primaryAction, pressed && { opacity: 0.85 }]}
              onPress={() => handleCall('113')}>
              <Ionicons name="call-outline" size={16} color={colors.onPrimary} />
              <Text style={styles.primaryActionText}> Llamar 113</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.helplineCard}>
          <View style={styles.helplineInfo}>
            <Text style={styles.helplineName}>SAMU 106</Text>
            <Text style={styles.helplineDesc}>Sistema de Atención Médica de Urgencia</Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.primaryAction,
              { alignSelf: 'flex-end' },
              pressed && { opacity: 0.85 },
            ]}
            onPress={() => handleCall('106')}>
            <Ionicons name="medkit-outline" size={16} color={colors.onPrimary} />
            <Text style={styles.primaryActionText}> Llamar 106</Text>
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [styles.locationButton, pressed && { opacity: 0.85 }]}
          onPress={onRequestLocation}>
          <Ionicons name="location-outline" size={16} color={colors.primary} />
          <Text style={styles.locationButtonText}> Buscar Centros Cercanos en Cusco</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: spacing.screenPadding,
    zIndex: 100,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: spacing.borderRadiusXl,
    padding: spacing.cardPadding,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: 'bold',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  helplineCard: {
    backgroundColor: colors.surfaceLow,
    borderRadius: spacing.borderRadiusMd,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  helplineInfo: {
    marginBottom: spacing.sm,
  },
  helplineName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  helplineDesc: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  helplineActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHigh,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: spacing.borderRadiusSm,
    marginRight: 8,
  },
  secondaryActionText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: spacing.borderRadiusSm,
  },
  primaryActionText: {
    color: colors.onPrimary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryContainer,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingVertical: 12,
    borderRadius: spacing.borderRadiusMd,
    marginTop: spacing.sm,
  },
  locationButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
