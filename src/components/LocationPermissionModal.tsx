import React from 'react';
import { StyleSheet, View, Text, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';

interface LocationPermissionModalProps {
  visible: boolean;
  onGrant: () => void;
  onDeny: () => void;
}

export const LocationPermissionModal: React.FC<LocationPermissionModalProps> = ({
  visible,
  onGrant,
  onDeny,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Ionicons name="location-outline" size={40} color={colors.primary} style={styles.icon} />
          <Text style={styles.title}>Compartir Ubicación</Text>
          <Text style={styles.description}>
            Para mostrarte los centros de salud mental más cercanos en Cusco, necesitamos acceder a
            tu ubicación.
          </Text>
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.denyButton,
                pressed && { opacity: 0.8 },
              ]}
              onPress={onDeny}>
              <Text style={styles.denyText}>Ahora no</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.grantButton,
                pressed && { opacity: 0.85 },
              ]}
              onPress={onGrant}>
              <Text style={styles.grantText}>Sí, compartir</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.screenPadding,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: spacing.borderRadiusXl,
    padding: spacing.cardPadding,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  icon: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: spacing.borderRadiusSm,
    alignItems: 'center',
  },
  denyButton: {
    backgroundColor: colors.surfaceLow,
    marginRight: 8,
  },
  denyText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  grantButton: {
    backgroundColor: colors.primary,
    marginLeft: 8,
  },
  grantText: {
    color: colors.onPrimary,
    fontWeight: 'bold',
    fontSize: 14,
  },
});
