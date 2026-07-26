import React from 'react';
import { StyleSheet, View, Text, Pressable, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { Glass, GlassScrim } from './Glass';

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
    <GlassScrim style={styles.overlay}>
      <Glass
        level="high"
        style={styles.card}
        contentStyle={styles.cardContent}
        borderColor={colors.dangerBorder}
        glowColor={colors.danger}>
        <View style={styles.header}>
          <View style={styles.badge}>
            <Ionicons name="shield-checkmark" size={14} color={colors.danger} />
            <Text style={styles.badgeText}> Estamos contigo</Text>
          </View>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
            hitSlop={8}
            style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
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
              accessibilityRole="button"
              style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}
              onPress={() => handleCopy('113')}>
              <Ionicons name="copy-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.secondaryActionText}> Copiar</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}
              onPress={() => handleCall('113')}>
              <LinearGradient
                colors={colors.dangerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionFill}>
                <Ionicons name="call-outline" size={16} color={colors.onPrimary} />
                <Text style={styles.primaryActionText}> Llamar 113</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>

        <View style={styles.helplineCard}>
          <View style={styles.helplineInfo}>
            <Text style={styles.helplineName}>SAMU 106</Text>
            <Text style={styles.helplineDesc}>Sistema de Atención Médica de Urgencia</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.primaryAction,
              { alignSelf: 'flex-end' },
              pressed && styles.pressed,
            ]}
            onPress={() => handleCall('106')}>
            <LinearGradient
              colors={colors.warningGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionFill}>
              <Ionicons name="medkit-outline" size={16} color={colors.onPrimary} />
              <Text style={styles.primaryActionText}> Llamar 106</Text>
            </LinearGradient>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.locationButton, pressed && styles.pressed]}
          onPress={onRequestLocation}>
          <Ionicons name="navigate-outline" size={16} color={colors.primary} />
          <Text style={styles.locationButtonText}> Buscar Centros Cercanos en Cusco</Text>
        </Pressable>
      </Glass>
    </GlassScrim>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  card: {
    width: '100%',
  },
  cardContent: {
    padding: spacing.cardPadding,
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
    borderWidth: 1,
    borderColor: colors.dangerBorder,
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
    backgroundColor: colors.surfaceInset,
    borderWidth: 1,
    borderColor: colors.borderDark,
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
    backgroundColor: colors.surfaceInset,
    borderWidth: 1,
    borderColor: colors.borderDark,
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDark,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: spacing.borderRadiusMd,
    marginRight: 8,
  },
  secondaryActionText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  primaryAction: {
    borderRadius: spacing.borderRadiusMd,
    overflow: 'hidden',
  },
  actionFill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
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
    borderColor: colors.glassBorderActive,
    paddingVertical: 12,
    borderRadius: spacing.borderRadiusMd,
    marginTop: spacing.sm,
  },
  locationButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  pressed: {
    opacity: 0.85,
  },
});
