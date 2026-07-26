import React from 'react';
import { StyleSheet, View, Text, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { AuthButton } from './AuthButton';
import { Glass, GlassScrim } from './Glass';

interface WelcomeModalProps {
  visible: boolean;
  onClose: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ visible, onClose }) => {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <GlassScrim>
        <Glass level="high" style={styles.card} contentStyle={styles.cardContent}>
          <View style={styles.iconRow}>
            <Ionicons name="compass-outline" size={32} color={colors.primary} />
          </View>
          <Text style={styles.title}>Asistente Hamilton</Text>
          <Text style={styles.subtitle}>Tu acompañante para el bienestar mental</Text>

          <View style={styles.features}>
            <View style={styles.featureRow}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.primary} />
              <Text style={styles.featureText}>Conversa libremente sobre cómo te sientes</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
              <Text style={styles.featureText}>Espacio seguro y confidencial</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="call-outline" size={20} color={colors.primary} />
              <Text style={styles.featureText}>Recursos de apoyo y líneas de emergencia</Text>
            </View>
          </View>

          <AuthButton label="Comenzar" onPress={onClose} style={styles.cta} />
        </Glass>
      </GlassScrim>
    </Modal>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 340,
  },
  cardContent: {
    padding: spacing.cardPadding,
    alignItems: 'center',
  },
  iconRow: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  features: {
    width: '100%',
    marginBottom: spacing.xs,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  featureText: {
    fontSize: 14,
    color: colors.textPrimary,
    marginLeft: spacing.sm + 2,
    flex: 1,
  },
  cta: {
    width: '100%',
  },
});
