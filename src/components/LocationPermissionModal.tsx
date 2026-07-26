import React from 'react';
import { StyleSheet, View, Text, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { Glass, GlassScrim } from './Glass';

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
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <GlassScrim>
        <Glass level="high" style={styles.card} contentStyle={styles.cardContent}>
          <Ionicons name="navigate-outline" size={36} color={colors.primary} style={styles.icon} />
          <Text style={styles.title}>Compartir Ubicación</Text>
          <Text style={styles.description}>
            Para mostrarte los centros de salud mental más cercanos en Cusco, necesitamos acceder a
            tu ubicación.
          </Text>
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.button, styles.denyButton, pressed && styles.pressed]}
              onPress={onDeny}>
              <Text style={styles.denyText}>Ahora no</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.button,
                styles.grantWrapper,
                pressed && styles.pressed,
              ]}
              onPress={onGrant}>
              <LinearGradient
                colors={colors.primaryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.grantFill}>
                <Text style={styles.grantText}>Sí, compartir</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </Glass>
      </GlassScrim>
    </Modal>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 330,
  },
  cardContent: {
    padding: spacing.cardPadding,
    alignItems: 'center',
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
    borderRadius: spacing.borderRadiusMd,
    overflow: 'hidden',
  },
  denyButton: {
    backgroundColor: colors.surfaceInset,
    borderWidth: 1,
    borderColor: colors.borderDark,
    marginRight: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  denyText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  grantWrapper: {
    marginLeft: 8,
  },
  grantFill: {
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: spacing.borderRadiusMd,
  },
  grantText: {
    color: colors.onPrimary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  pressed: {
    opacity: 0.85,
  },
});
